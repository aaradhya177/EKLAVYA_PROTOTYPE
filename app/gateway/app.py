import time
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth.router import router as auth_router
from app.career.router import router as career_router
from app.core.config import settings
from app.core.consent import ConsentEnforcementMiddleware
from app.core.redis_client import get_redis_client
from app.core.responses import error_response, success_response
from app.financial.router import router as financial_router
from app.integrations.competition_feed import router as competition_feed_router
from app.integrations.sai_sync import router as sai_sync_router
from app.injury.router import router as injury_router
from app.ml.router import router as ml_router
from app.performance.router import router as performance_router
from app.uadp.router import router as uadp_router


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/health"}:
            return await call_next(request)
        redis_client = get_redis_client()
        client_host = request.client.host if request.client else "anonymous"
        identity = request.headers.get("authorization") or client_host or "anonymous"
        bucket = int(time.time() // 60)
        key = f"ratelimit:{identity}:{bucket}"
        try:
            count = redis_client.incr(key)
            ttl = redis_client.ttl(key)
            if ttl in {-1, -2}:
                redis_client.expire(key, 60)
        except RedisError:
            count = 0
        if count > settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content=error_response(message="Rate limit exceeded", data=None),
            )
        return await call_next(request)


def create_gateway_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(ConsentEnforcementMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    app.include_router(uadp_router, prefix="/api/v1/uadp")
    app.include_router(performance_router, prefix="/api/v1/performance")
    app.include_router(injury_router, prefix="/api/v1/injury")
    app.include_router(career_router, prefix="/api/v1/career")
    app.include_router(financial_router, prefix="/api/v1/financial")
    app.include_router(ml_router, prefix="/api/v1/ml")
    app.include_router(auth_router, prefix="/api/v1/auth")
    app.include_router(sai_sync_router, prefix="/api/v1/integrations")
    app.include_router(competition_feed_router, prefix="/api/v1/integrations")

    @app.get("/health")
    async def health() -> dict[str, Any]:
        from app.core import database
        from app.core.celery_app import celery_app
        from sqlalchemy import text

        db_status = "ok"
        redis_status = "ok"
        celery_status = "ok"

        try:
            async with database.AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
        except Exception:
            db_status = "error"

        try:
            get_redis_client().ping()
        except Exception:
            redis_status = "error"

        try:
            if not celery_app.connection().as_uri():
                celery_status = "error"
        except Exception:
            celery_status = "error"

        return success_response(
            {
                "db": db_status,
                "redis": redis_status,
                "celery": celery_status,
                "version": settings.app_version,
            },
            "Health check fetched",
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=str(exc.detail), data=None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_response(message="Validation error", data=exc.errors()),
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content=error_response(message=getattr(exc, "detail", str(exc)), data=None),
        )

    return app
