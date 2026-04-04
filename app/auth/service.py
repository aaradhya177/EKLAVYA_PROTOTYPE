from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.auth.schemas import LoginRequest, RegisterRequest
from app.core.config import settings
from app.core.redis_client import get_redis_client
from app.core.secrets import secret_manager
from app.uadp.models import Athlete

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(password, hashed_password)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_token(payload: dict, expires_delta: timedelta, token_type: str) -> str:
    now = _utcnow()
    to_encode = {
        **payload,
        "exp": now + expires_delta,
        "iat": now,
        "type": token_type,
        "jti": str(uuid4()),
    }
    return jwt.encode(to_encode, secret_manager.get("JWT_SECRET_KEY"), algorithm=settings.jwt_algorithm)


def create_access_token(user: User) -> str:
    return create_token(
        {"sub": str(user.id), "role": user.role.value, "athlete_id": str(user.athlete_id) if user.athlete_id else None},
        timedelta(minutes=settings.access_token_expire_minutes),
        "access",
    )


def create_refresh_token(user: User) -> str:
    return create_token(
        {"sub": str(user.id), "role": user.role.value, "athlete_id": str(user.athlete_id) if user.athlete_id else None},
        timedelta(days=settings.refresh_token_expire_days),
        "refresh",
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, secret_manager.get("JWT_SECRET_KEY"), algorithms=[settings.jwt_algorithm])


def invalidate_refresh_token(token: str) -> None:
    payload = decode_token(token)
    ttl = max(int(payload["exp"] - datetime.now(timezone.utc).timestamp()), 1)
    get_redis_client().setex(f"revoked:{payload['jti']}", ttl, "1")


def is_refresh_token_revoked(payload: dict) -> bool:
    return bool(get_redis_client().get(f"revoked:{payload['jti']}"))


async def register_user(session: AsyncSession, payload: RegisterRequest) -> User:
    existing = (
        await session.execute(select(User).where(User.email == str(payload.email)))
    ).scalars().first()
    if existing:
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.role == UserRole.athlete and payload.athlete_id is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="athlete_id is required for athlete users")
    if payload.athlete_id:
        athlete = await session.get(Athlete, payload.athlete_id)
        if athlete is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Athlete not found")

    user = User(
        name=payload.name,
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        athlete_id=payload.athlete_id,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, payload: LoginRequest) -> User:
    from fastapi import HTTPException

    user = (
        await session.execute(select(User).where(User.email == str(payload.email)))
    ).scalars().first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return user


async def get_user_by_id(session: AsyncSession, user_id: UUID | str) -> User | None:
    return await session.get(User, UUID(str(user_id)))
