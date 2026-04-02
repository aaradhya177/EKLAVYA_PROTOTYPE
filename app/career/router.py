from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.career.schemas import (
    CareerGoalCreate,
    CareerGoalRead,
    CareerMilestoneCreate,
    CareerMilestoneRead,
    DevelopmentPlanCreate,
    DevelopmentPlanRead,
    TalentSignalRead,
)
from app.career.service import (
    create_career_goal,
    create_career_milestone,
    create_development_plan,
    get_active_plan,
    get_latest_talent_signal,
    list_all_signals,
    list_career_goals,
    list_career_milestones,
)
from app.core.auth import get_current_user, require_athlete_access, require_role
from app.core.database import get_db_session
from app.core.responses import success_response
from app.users.models import UserRole

router = APIRouter(tags=["career"])


@router.post("/goals/")
async def set_career_goal(
    request: Request,
    payload: CareerGoalCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(payload.athlete_id, session, current_user)
    goal = await create_career_goal(session, payload)
    return success_response(CareerGoalRead.model_validate(goal).model_dump(mode="json"), "Career goal created")


@router.get("/goals/{athlete_id}")
async def get_career_goals(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    goals = await list_career_goals(session, athlete_id)
    return success_response(
        [CareerGoalRead.model_validate(goal).model_dump(mode="json") for goal in goals],
        "Career goals fetched",
    )


@router.post("/milestones/")
async def log_career_milestone(
    request: Request,
    payload: CareerMilestoneCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(payload.athlete_id, session, current_user)
    milestone = await create_career_milestone(session, payload)
    return success_response(
        CareerMilestoneRead.model_validate(milestone).model_dump(mode="json"),
        "Career milestone logged",
    )


@router.get("/milestones/{athlete_id}")
async def get_career_milestones(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    milestones = await list_career_milestones(session, athlete_id)
    return success_response(
        [CareerMilestoneRead.model_validate(item).model_dump(mode="json") for item in milestones],
        "Career milestones fetched",
    )


@router.post("/plans/")
async def submit_development_plan(
    request: Request,
    payload: DevelopmentPlanCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(payload.athlete_id, session, current_user)
    if current_user.role.value == "coach" and payload.coach_id != current_user.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Coach must use their own coach_id")
    plan = await create_development_plan(session, payload)
    return success_response(
        DevelopmentPlanRead.model_validate(plan).model_dump(mode="json"),
        "Development plan created",
    )


@router.get("/plans/{athlete_id}")
async def current_development_plan(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    plan = await get_active_plan(session, athlete_id)
    return success_response(
        DevelopmentPlanRead.model_validate(plan).model_dump(mode="json") if plan else None,
        "Development plan fetched",
    )


@router.get("/signals/federation/all")
async def federation_signals(
    request: Request,
    _: User = Depends(require_role(UserRole.federation_admin)),
    session: AsyncSession = Depends(get_db_session),
):
    signals = await list_all_signals(session)
    return success_response(
        [TalentSignalRead.model_validate(signal).model_dump(mode="json") for signal in signals],
        "Federation talent signals fetched",
    )


@router.get("/signals/{athlete_id:uuid}")
async def latest_talent_signal(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    signal = await get_latest_talent_signal(session, athlete_id)
    return success_response(
        TalentSignalRead.model_validate(signal).model_dump(mode="json") if signal else None,
        "Talent signal fetched",
    )
