from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.auth.service import decode_token, get_user_by_id
from app.career.models import DevelopmentPlan
from app.core.database import get_db_session
from app.performance.models import SessionLog

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid access token")
    user = await get_user_by_id(session, UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(*allowed_roles: UserRole) -> Callable:
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user

    return dependency


async def require_athlete_access(
    athlete_id: UUID,
    session: AsyncSession,
    current_user: User,
) -> None:
    if current_user.role in {UserRole.sys_admin, UserRole.federation_admin}:
        return
    if current_user.role == UserRole.athlete:
        if current_user.athlete_id != athlete_id:
            raise HTTPException(status_code=403, detail="Cannot access another athlete")
        return
    if current_user.role == UserRole.coach:
        coached_session = (
            await session.execute(
                select(SessionLog.id).where(
                    SessionLog.athlete_id == athlete_id,
                    SessionLog.coach_id == current_user.id,
                )
            )
        ).scalars().first()
        coached_plan = (
            await session.execute(
                select(DevelopmentPlan.id).where(
                    DevelopmentPlan.athlete_id == athlete_id,
                    DevelopmentPlan.coach_id == current_user.id,
                )
            )
        ).scalars().first()
        if coached_session or coached_plan:
            return
    raise HTTPException(status_code=403, detail="Insufficient athlete access")
