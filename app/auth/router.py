from jose import JWTError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserRead,
)
from app.auth.service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_by_id,
    invalidate_refresh_token,
    is_refresh_token_revoked,
    register_user,
)
from app.core.database import get_db_session
from app.core.responses import success_response

router = APIRouter(tags=["auth"])


@router.post("/register")
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_db_session)):
    user = await register_user(session, payload)
    return success_response(UserRead.model_validate(user).model_dump(mode="json"), "User registered")


@router.post("/login")
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db_session)):
    user = await authenticate_user(session, payload)
    tokens = TokenPair(
        access_token=create_access_token(user),
        refresh_token=create_refresh_token(user),
    )
    return success_response(tokens.model_dump(mode="json"), "Login successful")


@router.post("/refresh")
async def refresh_token(payload: RefreshRequest, session: AsyncSession = Depends(get_db_session)):
    try:
        token_payload = decode_token(payload.refresh_token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
    if token_payload.get("type") != "refresh" or is_refresh_token_revoked(token_payload):
        raise HTTPException(status_code=401, detail="Refresh token invalidated")
    user = await get_user_by_id(session, token_payload["sub"])
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    token = create_access_token(user)
    return success_response({"access_token": token, "token_type": "bearer"}, "Access token refreshed")


@router.post("/logout")
async def logout(payload: LogoutRequest):
    try:
        invalidate_refresh_token(payload.refresh_token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
    return success_response(data=None, message="Logged out")
