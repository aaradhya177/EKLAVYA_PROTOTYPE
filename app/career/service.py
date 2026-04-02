from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.career.models import (
    CareerGoal,
    CareerMilestone,
    DevelopmentPlan,
    TalentSignal,
    TalentSignalType,
)
from app.career.schemas import CareerGoalCreate, CareerMilestoneCreate, DevelopmentPlanCreate
from app.core.event_bus import notify
from app.performance.models import PerformanceIndex
from app.uadp.models import Athlete, AthleteTier
from app.users.models import User


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def _get_coach_or_404(session: AsyncSession, coach_id: UUID) -> User:
    coach = await session.get(User, coach_id)
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    return coach


async def create_career_goal(session: AsyncSession, payload: CareerGoalCreate) -> CareerGoal:
    await _get_athlete_or_404(session, payload.athlete_id)
    goal = CareerGoal(**payload.model_dump())
    session.add(goal)
    await session.commit()
    await session.refresh(goal)
    return goal


async def list_career_goals(session: AsyncSession, athlete_id: UUID) -> list[CareerGoal]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = (
        select(CareerGoal)
        .where(CareerGoal.athlete_id == athlete_id)
        .order_by(CareerGoal.target_date.asc(), CareerGoal.id.asc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def create_career_milestone(session: AsyncSession, payload: CareerMilestoneCreate) -> CareerMilestone:
    await _get_athlete_or_404(session, payload.athlete_id)
    if payload.verified_by:
        await _get_coach_or_404(session, payload.verified_by)
    milestone = CareerMilestone(
        athlete_id=payload.athlete_id,
        milestone_type=payload.milestone_type,
        achieved_at=_ensure_utc(payload.achieved_at),
        description=payload.description,
        verified_by=payload.verified_by,
    )
    session.add(milestone)
    await session.commit()
    await session.refresh(milestone)
    return milestone


async def list_career_milestones(session: AsyncSession, athlete_id: UUID) -> list[CareerMilestone]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = (
        select(CareerMilestone)
        .where(CareerMilestone.athlete_id == athlete_id)
        .order_by(CareerMilestone.achieved_at.desc(), CareerMilestone.id.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


def _blocks_overlap(block_a: dict, block_b: dict) -> bool:
    return block_a["start_date"] <= block_b["end_date"] and block_b["start_date"] <= block_a["end_date"]


def _weekly_load_targets(block: dict) -> list[dict]:
    total_days = (block["end_date"] - block["start_date"]).days + 1
    total_weeks = max((total_days + 6) // 7, 1)
    weekly_target = block["volume_target"] / total_weeks
    targets: list[dict] = []
    current_start = block["start_date"]
    week_number = 1
    while current_start <= block["end_date"]:
        current_end = min(current_start + timedelta(days=6), block["end_date"])
        targets.append(
            {
                "week_number": week_number,
                "start_date": current_start.isoformat(),
                "end_date": current_end.isoformat(),
                "load_target": round(weekly_target, 2),
            }
        )
        current_start = current_end + timedelta(days=1)
        week_number += 1
    return targets


async def create_development_plan(session: AsyncSession, payload: DevelopmentPlanCreate) -> DevelopmentPlan:
    await _get_athlete_or_404(session, payload.athlete_id)
    await _get_coach_or_404(session, payload.coach_id)

    blocks = [block.model_dump() for block in payload.periodization_blocks]
    for block in blocks:
        if block["start_date"] > block["end_date"]:
            raise HTTPException(status_code=400, detail="Block start_date must be before end_date")
        if block["start_date"] < payload.plan_period_start or block["end_date"] > payload.plan_period_end:
            raise HTTPException(status_code=400, detail="Blocks must stay within the plan period")

    for index, block in enumerate(blocks):
        for other in blocks[index + 1 :]:
            if _blocks_overlap(block, other):
                raise HTTPException(status_code=400, detail="Periodization block date ranges cannot overlap")

    goals = await list_career_goals(session, payload.athlete_id)
    active_goal_dates = [goal.target_date for goal in goals if goal.status.value == "active"]
    if active_goal_dates:
        latest_target = max(active_goal_dates)
        if payload.plan_period_end > latest_target:
            raise HTTPException(status_code=400, detail="Plan period must align with the active career goal target date")

    enriched_blocks = []
    for block in blocks:
        enriched_block = {
            **block,
            "start_date": block["start_date"].isoformat(),
            "end_date": block["end_date"].isoformat(),
            "weekly_load_targets": _weekly_load_targets(block),
        }
        enriched_blocks.append(enriched_block)

    now = _utcnow()
    plan = DevelopmentPlan(
        athlete_id=payload.athlete_id,
        coach_id=payload.coach_id,
        plan_period_start=payload.plan_period_start,
        plan_period_end=payload.plan_period_end,
        goals=payload.goals,
        periodization_blocks=enriched_blocks,
        created_at=now,
        updated_at=now,
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


async def get_active_plan(session: AsyncSession, athlete_id: UUID) -> DevelopmentPlan | None:
    await _get_athlete_or_404(session, athlete_id)
    today = _utcnow().date()
    stmt = (
        select(DevelopmentPlan)
        .where(
            DevelopmentPlan.athlete_id == athlete_id,
            DevelopmentPlan.plan_period_start <= today,
            DevelopmentPlan.plan_period_end >= today,
        )
        .order_by(DevelopmentPlan.updated_at.desc(), DevelopmentPlan.id.desc())
    )
    plan = (await session.execute(stmt)).scalars().first()
    if plan is not None:
        return plan
    fallback_stmt = (
        select(DevelopmentPlan)
        .where(DevelopmentPlan.athlete_id == athlete_id)
        .order_by(DevelopmentPlan.updated_at.desc(), DevelopmentPlan.id.desc())
    )
    return (await session.execute(fallback_stmt)).scalars().first()


async def get_latest_talent_signal(session: AsyncSession, athlete_id: UUID) -> TalentSignal | None:
    await _get_athlete_or_404(session, athlete_id)
    stmt = (
        select(TalentSignal)
        .where(TalentSignal.athlete_id == athlete_id)
        .order_by(TalentSignal.computed_at.desc(), TalentSignal.id.desc())
    )
    return (await session.execute(stmt)).scalars().first()


async def list_all_signals(session: AsyncSession) -> list[TalentSignal]:
    stmt = select(TalentSignal).order_by(TalentSignal.computed_at.desc(), TalentSignal.id.desc())
    return list((await session.execute(stmt)).scalars().all())


class TalentSignalDetector:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _latest_indices_by_name(self, athlete_id: UUID) -> dict[str, list[PerformanceIndex]]:
        stmt = (
            select(PerformanceIndex)
            .where(PerformanceIndex.athlete_id == athlete_id)
            .order_by(PerformanceIndex.index_name.asc(), PerformanceIndex.computed_at.asc(), PerformanceIndex.id.asc())
        )
        all_rows = list((await self.session.execute(stmt)).scalars().all())
        grouped: dict[str, list[PerformanceIndex]] = defaultdict(list)
        for row in all_rows:
            grouped[row.index_name].append(row)
        return grouped

    def _window_average(self, rows: list[PerformanceIndex], start: datetime, end: datetime) -> tuple[float | None, list[int]]:
        matching = [row for row in rows if start <= _ensure_utc(row.computed_at) < end]
        if not matching:
            return None, []
        return sum(row.value for row in matching) / len(matching), [row.id for row in matching]

    async def detect_for_athlete(self, athlete_id: UUID) -> TalentSignal | None:
        athlete = await _get_athlete_or_404(self.session, athlete_id)
        now = _utcnow()
        grouped = await self._latest_indices_by_name(athlete_id)
        evidence: list[dict] = []
        signal_type: TalentSignalType | None = None

        breakthrough_found = False
        decline_found = False
        plateau_candidate = True

        for index_name, rows in grouped.items():
            current_avg, current_ids = self._window_average(rows, now - timedelta(days=28), now)
            prior_avg, prior_ids = self._window_average(rows, now - timedelta(days=56), now - timedelta(days=28))
            if current_avg is None or prior_avg is None or prior_avg == 0:
                plateau_candidate = False
                continue

            change = ((current_avg - prior_avg) / abs(prior_avg)) * 100.0
            if change > 15:
                breakthrough_found = True
                evidence.append(
                    {
                        "index_name": index_name,
                        "change_percent": round(change, 2),
                        "performance_index_ids": current_ids + prior_ids,
                    }
                )
            elif change < -10:
                decline_found = True
                evidence.append(
                    {
                        "index_name": index_name,
                        "change_percent": round(change, 2),
                        "performance_index_ids": current_ids + prior_ids,
                    }
                )

            if abs(change) >= 3:
                plateau_candidate = False

        if breakthrough_found:
            signal_type = TalentSignalType.breakthrough
        elif decline_found:
            signal_type = TalentSignalType.decline
        elif plateau_candidate and grouped:
            signal_type = TalentSignalType.plateau
            evidence.append({"rule": "all_indices_change_lt_3_over_56d"})
        elif athlete.tier in {AthleteTier.grassroots, AthleteTier.state}:
            latest_rows = [
                rows[-1]
                for rows in grouped.values()
                if rows and rows[-1].percentile_in_sport >= 90.0
            ]
            if latest_rows:
                signal_type = TalentSignalType.emerging
                evidence.extend(
                    [
                        {
                            "index_name": row.index_name,
                            "percentile_in_sport": row.percentile_in_sport,
                            "performance_index_ids": [row.id],
                        }
                        for row in latest_rows
                    ]
                )

        if signal_type is None:
            return None

        signal = TalentSignal(
            athlete_id=athlete_id,
            signal_type=signal_type,
            computed_at=now,
            evidence=evidence,
        )
        self.session.add(signal)
        await self.session.flush()
        await notify(
            self.session,
            "talent_signals",
            {
                "athlete_id": str(athlete_id),
                "signal_type": signal_type.value,
                "signal_id": signal.id,
            },
        )
        await self.session.commit()
        await self.session.refresh(signal)
        return signal

    async def detect_all(self) -> int:
        athlete_ids = list((await self.session.execute(select(Athlete.id))).scalars().all())
        created = 0
        for athlete_id in athlete_ids:
            signal = await self.detect_for_athlete(athlete_id)
            if signal is not None:
                created += 1
        return created
