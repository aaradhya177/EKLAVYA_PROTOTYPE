from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.auth import get_current_user, require_athlete_access, require_role
from app.core.database import get_db_session
from app.core.responses import success_response
from app.injury.service import ensure_health_consent
from app.ml.schemas import InjuryExplanationFactor, MLModelRead
from app.ml.service import explain_injury_prediction, list_registered_models
from app.ml.tasks import retrain_injury_model, retrain_performance_models
from app.users.models import UserRole

router = APIRouter(tags=["ml"])


@router.post("/train/injury")
async def train_injury_endpoint(request: Request, _: User = Depends(require_role(UserRole.sys_admin))):
    retrain_injury_model.delay()
    return success_response({"queued": True, "model_name": "injury_risk"}, "Injury model retrain queued")


@router.post("/train/performance")
async def train_performance_endpoint(request: Request, _: User = Depends(require_role(UserRole.sys_admin))):
    retrain_performance_models.delay()
    return success_response({"queued": True}, "Performance model retrain queued")


@router.get("/models/")
async def list_models(request: Request, _: User = Depends(get_current_user)):
    models = await list_registered_models()
    return success_response([MLModelRead.model_validate(item).model_dump(mode="json") for item in models], "Models fetched")


@router.get("/injury/explain/{athlete_id}")
async def explain_injury_endpoint(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    await ensure_health_consent(session, athlete_id)
    factors = await explain_injury_prediction(session, athlete_id)
    return success_response(
        [InjuryExplanationFactor.model_validate(item).model_dump(mode="json") for item in factors],
        "Injury explanation fetched",
    )
