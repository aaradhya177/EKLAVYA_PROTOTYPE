from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from math import sqrt
from statistics import mean
from uuid import UUID

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.performance.models import PerformanceIndex, SessionLog, SessionType
from app.uadp.models import Athlete, Sport

FEATURE_COLUMNS = [
    "avg_load_last_10",
    "load_trend_last_3",
    "avg_rpe_last_5",
    "rpe_trend_last_3",
    "acwr",
    "days_since_competition",
    "monotony",
    "strain",
    "rolling_avg_hr",
]


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _session_load(session_log: SessionLog) -> float:
    if session_log.end_time is None or session_log.rpe is None:
        return 0.0
    duration_minutes = max((session_log.end_time - session_log.start_time).total_seconds() / 60.0, 0.0)
    return float(session_log.rpe) * duration_minutes


def _performance_score(session_log: SessionLog, personal_best: float) -> float:
    distance = float((session_log.raw_metrics or {}).get("distance_km", 0.0))
    heart_rate = float((session_log.raw_metrics or {}).get("avg_hr", 0.0))
    steps = float((session_log.raw_metrics or {}).get("steps", 0.0))
    composite = distance * 0.4 + (heart_rate / 200.0) * 0.3 + (steps / 20000.0) * 0.3
    if personal_best <= 0:
        return min(max(composite, 0.0), 1.0)
    return min(max(composite / personal_best, 0.0), 1.0)


def _latest_index(indices: list[PerformanceIndex], cutoff: datetime, index_name: str) -> float:
    for item in indices:
        ts = _ensure_utc(item.computed_at)
        if item.index_name == index_name and ts is not None and ts <= cutoff:
            return float(item.value)
    return 0.0


def _days_since_competition(sessions: list[SessionLog], cutoff: datetime) -> float:
    competitions = [
        _ensure_utc(item.end_time)
        for item in sessions
        if item.session_type == SessionType.competition and item.end_time is not None and _ensure_utc(item.end_time) <= cutoff
    ]
    if not competitions:
        return 30.0
    return float((cutoff - max(competitions)).days)


def build_performance_pipeline():
    preprocessor = ColumnTransformer([("numeric", StandardScaler(), FEATURE_COLUMNS)])
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", GradientBoostingRegressor(random_state=108)),
        ]
    )


@dataclass
class PerformanceTrainingResult:
    model: object
    metrics: dict[str, float | int]
    sport: str


async def build_performance_training_dataset(session: AsyncSession) -> pd.DataFrame:
    athletes = list((await session.execute(select(Athlete))).scalars().all())
    sports = list((await session.execute(select(Sport))).scalars().all())
    sessions = list(
        (
            await session.execute(
                select(SessionLog).where(SessionLog.end_time.is_not(None), SessionLog.rpe.is_not(None)).order_by(SessionLog.end_time.asc())
            )
        ).scalars().all()
    )
    indices = list((await session.execute(select(PerformanceIndex).order_by(PerformanceIndex.computed_at.desc()))).scalars().all())
    sport_map = {sport.id: sport.name for sport in sports}
    athlete_map = {athlete.id: athlete for athlete in athletes}
    sessions_by_athlete: dict[UUID, list[SessionLog]] = defaultdict(list)
    indices_by_athlete: dict[UUID, list[PerformanceIndex]] = defaultdict(list)
    for row in sessions:
        sessions_by_athlete[row.athlete_id].append(row)
    for row in indices:
        indices_by_athlete[row.athlete_id].append(row)

    rows: list[dict] = []
    for athlete_id, athlete_sessions in sessions_by_athlete.items():
        athlete = athlete_map.get(athlete_id)
        if athlete is None or len(athlete_sessions) < 3:
            continue
        personal_best = 0.0
        for item in athlete_sessions:
            personal_best = max(personal_best, _performance_score(item, 1.0))
        for idx in range(1, len(athlete_sessions)):
            history = athlete_sessions[max(0, idx - 10):idx]
            if not history:
                continue
            target_session = athlete_sessions[idx]
            cutoff = _ensure_utc(history[-1].end_time)
            if cutoff is None:
                continue
            loads = [_session_load(row) for row in history]
            rpes = [float(row.rpe or 0) for row in history]
            avg_hr = [float((row.raw_metrics or {}).get("avg_hr", 0.0)) for row in history]
            rows.append(
                {
                    "sport": sport_map.get(target_session.sport_id, "Unknown"),
                    "athlete_id": str(athlete_id),
                    "avg_load_last_10": mean(loads) if loads else 0.0,
                    "load_trend_last_3": (mean(loads[-3:]) - mean(loads[:-3])) if len(loads) > 3 else (mean(loads[-3:]) if loads else 0.0),
                    "avg_rpe_last_5": mean(rpes[-5:]) if rpes else 0.0,
                    "rpe_trend_last_3": (mean(rpes[-3:]) - mean(rpes[:-3])) if len(rpes) > 3 else (mean(rpes[-3:]) if rpes else 0.0),
                    "acwr": _latest_index(indices_by_athlete[athlete_id], cutoff, "acwr"),
                    "days_since_competition": _days_since_competition(history, cutoff),
                    "monotony": _latest_index(indices_by_athlete[athlete_id], cutoff, "monotony"),
                    "strain": _latest_index(indices_by_athlete[athlete_id], cutoff, "strain"),
                    "rolling_avg_hr": mean(avg_hr) if avg_hr else 0.0,
                    "target": _performance_score(target_session, personal_best),
                }
            )
    return pd.DataFrame(rows)


def train_per_sport_model(dataset: pd.DataFrame, sport_name: str) -> PerformanceTrainingResult | None:
    sport_df = dataset[dataset["sport"] == sport_name].copy()
    if len(sport_df) < 8:
        return None
    X = sport_df[FEATURE_COLUMNS]
    y = sport_df["target"]
    cv = KFold(n_splits=min(5, len(sport_df)), shuffle=True, random_state=108)
    maes: list[float] = []
    rmses: list[float] = []
    r2s: list[float] = []
    for train_idx, test_idx in cv.split(X):
        model = build_performance_pipeline()
        model.fit(X.iloc[train_idx], y.iloc[train_idx])
        predictions = model.predict(X.iloc[test_idx])
        maes.append(float(mean_absolute_error(y.iloc[test_idx], predictions)))
        rmses.append(float(sqrt(mean_squared_error(y.iloc[test_idx], predictions))))
        r2s.append(float(r2_score(y.iloc[test_idx], predictions)))

    final_model = build_performance_pipeline()
    final_model.fit(X, y)
    return PerformanceTrainingResult(
        model=final_model,
        sport=sport_name,
        metrics={
            "mae": round(mean(maes), 4),
            "rmse": round(mean(rmses), 4),
            "r2": round(mean(r2s), 4),
            "rows": int(len(sport_df)),
        },
    )
