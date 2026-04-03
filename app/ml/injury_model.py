from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from statistics import mean
from uuid import UUID

import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.injury.models import InjuryRecord
from app.performance.models import PerformanceIndex, SessionLog, SessionType
from app.uadp.models import Athlete, FeatureSnapshot, Sport

NUMERIC_COLUMNS = [
    "acwr_7d",
    "acwr_28d",
    "monotony_7d",
    "strain_7d",
    "days_since_last_rest",
    "avg_rpe_7d",
    "avg_rpe_28d",
    "prior_injury_90d",
    "sleep_score_7d",
    "sessions_per_week_7d",
]
CATEGORICAL_COLUMNS = ["sport", "tier"]
FEATURE_COLUMNS = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _latest_index_before(indices: list[PerformanceIndex], name: str, cutoff: datetime, lookback_days: int | None = None) -> float:
    for item in indices:
        ts = _ensure_utc(item.computed_at)
        if item.index_name != name or ts is None or ts > cutoff:
            continue
        if lookback_days is not None and ts < cutoff - timedelta(days=lookback_days):
            continue
        return float(item.value)
    return 0.0


def _latest_sleep_before(snapshots: list[FeatureSnapshot], cutoff: datetime) -> float:
    for item in snapshots:
        ts = _ensure_utc(item.computed_at)
        if item.feature_name != "sleep_quality_score" or ts is None or ts > cutoff:
            continue
        return float(item.value)
    return 0.0


def _session_load(session_log: SessionLog) -> float:
    if session_log.end_time is None or session_log.rpe is None:
        return 0.0
    duration_minutes = max((session_log.end_time - session_log.start_time).total_seconds() / 60.0, 0.0)
    return float(session_log.rpe) * duration_minutes


def _days_since_last_rest(sessions: list[SessionLog], cutoff: datetime) -> int:
    active_days = {
        _ensure_utc(item.end_time).date()
        for item in sessions
        if item.end_time is not None and _ensure_utc(item.end_time) is not None and _ensure_utc(item.end_time) <= cutoff
    }
    for offset in range(0, 31):
        day = (cutoff - timedelta(days=offset)).date()
        if day not in active_days:
            return offset
    return 31


def _avg_rpe(sessions: list[SessionLog], cutoff: datetime, window_days: int) -> float:
    values = [
        float(item.rpe)
        for item in sessions
        if item.rpe is not None and item.end_time is not None and cutoff - timedelta(days=window_days) <= _ensure_utc(item.end_time) <= cutoff
    ]
    return mean(values) if values else 0.0


def _sessions_per_week(sessions: list[SessionLog], cutoff: datetime) -> float:
    count = sum(
        1
        for item in sessions
        if item.end_time is not None and cutoff - timedelta(days=7) <= _ensure_utc(item.end_time) <= cutoff
    )
    return float(count)


def _prior_injury(injuries: list[InjuryRecord], cutoff: datetime) -> float:
    for item in injuries:
        occurred_at = _ensure_utc(item.occurred_at)
        if occurred_at is not None and cutoff - timedelta(days=90) <= occurred_at <= cutoff:
            return 1.0
    return 0.0


def _label_from_injuries(injuries: list[InjuryRecord], cutoff: datetime) -> int:
    for item in injuries:
        occurred_at = _ensure_utc(item.occurred_at)
        if occurred_at is not None and cutoff < occurred_at <= cutoff + timedelta(days=14):
            return 1
    return 0


@dataclass
class InjuryTrainingResult:
    model: object
    metrics: dict[str, float | int | bool]
    rows: int
    accepted: bool


async def build_injury_training_dataset(session: AsyncSession) -> pd.DataFrame:
    athletes = list((await session.execute(select(Athlete))).scalars().all())
    sports = list((await session.execute(select(Sport))).scalars().all())
    session_rows = list(
        (
            await session.execute(
                select(SessionLog).where(SessionLog.end_time.is_not(None), SessionLog.rpe.is_not(None)).order_by(SessionLog.end_time.asc())
            )
        ).scalars().all()
    )
    indices = list(
        (
            await session.execute(
                select(PerformanceIndex).order_by(PerformanceIndex.athlete_id.asc(), PerformanceIndex.computed_at.desc())
            )
        ).scalars().all()
    )
    injuries = list(
        (
            await session.execute(select(InjuryRecord).order_by(InjuryRecord.athlete_id.asc(), InjuryRecord.occurred_at.desc()))
        ).scalars().all()
    )
    snapshots = list(
        (
            await session.execute(select(FeatureSnapshot).order_by(FeatureSnapshot.athlete_id.asc(), FeatureSnapshot.computed_at.desc()))
        ).scalars().all()
    )

    sessions_by_athlete: dict[UUID, list[SessionLog]] = defaultdict(list)
    indices_by_athlete: dict[UUID, list[PerformanceIndex]] = defaultdict(list)
    injuries_by_athlete: dict[UUID, list[InjuryRecord]] = defaultdict(list)
    snapshots_by_athlete: dict[UUID, list[FeatureSnapshot]] = defaultdict(list)

    for row in session_rows:
        sessions_by_athlete[row.athlete_id].append(row)
    for row in indices:
        indices_by_athlete[row.athlete_id].append(row)
    for row in injuries:
        injuries_by_athlete[row.athlete_id].append(row)
    for row in snapshots:
        snapshots_by_athlete[row.athlete_id].append(row)

    athlete_map = {athlete.id: athlete for athlete in athletes}
    sport_map = {sport.id: sport.name for sport in sports}
    rows: list[dict] = []
    for athlete_id, athlete_sessions in sessions_by_athlete.items():
        athlete = athlete_map.get(athlete_id)
        if athlete is None:
            continue
        for item in athlete_sessions:
            cutoff = _ensure_utc(item.end_time)
            if cutoff is None:
                continue
            recent_sessions = [row for row in athlete_sessions if row.end_time is not None and _ensure_utc(row.end_time) <= cutoff]
            rows.append(
                {
                    "athlete_id": str(athlete_id),
                    "session_id": item.id,
                    "sport": sport_map.get(athlete.sport_id, "Unknown"),
                    "tier": athlete.tier.value,
                    "acwr_7d": _latest_index_before(indices_by_athlete[athlete_id], "acwr", cutoff, 7),
                    "acwr_28d": _latest_index_before(indices_by_athlete[athlete_id], "acwr", cutoff, 28),
                    "monotony_7d": _latest_index_before(indices_by_athlete[athlete_id], "monotony", cutoff, 7),
                    "strain_7d": _latest_index_before(indices_by_athlete[athlete_id], "strain", cutoff, 7),
                    "days_since_last_rest": float(_days_since_last_rest(recent_sessions, cutoff)),
                    "avg_rpe_7d": _avg_rpe(recent_sessions, cutoff, 7),
                    "avg_rpe_28d": _avg_rpe(recent_sessions, cutoff, 28),
                    "prior_injury_90d": _prior_injury(injuries_by_athlete[athlete_id], cutoff),
                    "sleep_score_7d": _latest_sleep_before(snapshots_by_athlete[athlete_id], cutoff),
                    "sessions_per_week_7d": _sessions_per_week(recent_sessions, cutoff),
                    "target": _label_from_injuries(injuries_by_athlete[athlete_id], cutoff),
                }
            )
    return pd.DataFrame(rows)


def build_injury_pipeline(use_smote: bool = True):
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_COLUMNS),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLUMNS),
        ]
    )
    classifier = GradientBoostingClassifier(random_state=108)
    if use_smote:
        return ImbPipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("smote", SMOTE(random_state=108)),
                ("classifier", classifier),
            ]
        )
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def _fit_pipeline(X: pd.DataFrame, y: pd.Series):
    positive = int(y.sum())
    use_smote = positive >= 6 and (len(y) - positive) >= 6
    pipeline = build_injury_pipeline(use_smote=use_smote)
    if not use_smote:
        negatives = max(int((y == 0).sum()), 1)
        positives = max(int((y == 1).sum()), 1)
        sample_weight = y.map({0: 1.0, 1: negatives / positives})
        pipeline.fit(X, y, classifier__sample_weight=sample_weight.to_numpy())
    else:
        pipeline.fit(X, y)
    return pipeline


def train_injury_classifier(dataset: pd.DataFrame) -> InjuryTrainingResult:
    if dataset.empty or dataset["target"].nunique() < 2 or int(dataset["target"].value_counts().min()) < 2:
        return InjuryTrainingResult(
            model=build_injury_pipeline(use_smote=False),
            metrics={"auc_roc": 0.5, "precision": 0.0, "recall": 0.0, "f1": 0.0, "rows": int(len(dataset))},
            rows=int(len(dataset)),
            accepted=False,
        )

    X = dataset[FEATURE_COLUMNS].copy()
    y = dataset["target"].astype(int)
    splits = min(5, max(2, int(y.value_counts().min())))
    cv = StratifiedKFold(n_splits=splits, shuffle=True, random_state=108)
    auc_scores: list[float] = []
    precision_scores: list[float] = []
    recall_scores: list[float] = []
    f1_scores: list[float] = []

    for train_idx, test_idx in cv.split(X, y):
        X_train = X.iloc[train_idx]
        X_test = X.iloc[test_idx]
        y_train = y.iloc[train_idx]
        y_test = y.iloc[test_idx]
        pipeline = _fit_pipeline(X_train, y_train)
        probabilities = pipeline.predict_proba(X_test)[:, 1]
        predictions = (probabilities >= 0.5).astype(int)
        auc_scores.append(float(roc_auc_score(y_test, probabilities)))
        precision_scores.append(float(precision_score(y_test, predictions, zero_division=0)))
        recall_scores.append(float(recall_score(y_test, predictions, zero_division=0)))
        f1_scores.append(float(f1_score(y_test, predictions, zero_division=0)))

    final_model = _fit_pipeline(X, y)
    metrics = {
        "auc_roc": round(mean(auc_scores), 4),
        "precision": round(mean(precision_scores), 4),
        "recall": round(mean(recall_scores), 4),
        "f1": round(mean(f1_scores), 4),
        "rows": int(len(dataset)),
        "positive_rows": int(y.sum()),
        "accepted": round(mean(auc_scores), 4) > 0.65,
    }
    return InjuryTrainingResult(
        model=final_model,
        metrics=metrics,
        rows=int(len(dataset)),
        accepted=bool(metrics["accepted"]),
    )
