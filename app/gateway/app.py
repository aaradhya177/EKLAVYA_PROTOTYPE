import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth.router import router as auth_router
from app.auth.service import decode_token
from app.career.router import router as career_router
from app.core.config import settings
from app.core.consent import ConsentEnforcementMiddleware
from app.core.logging import bind_log_context, configure_logging, get_logger, reset_log_context
from app.core.redis_client import get_redis_client
from app.core.responses import error_response
from app.financial.router import router as financial_router
from app.files.router import router as files_router
from app.gateway.health import build_health_payload
from app.gateway.metrics import observe_request_metrics, require_internal_metrics_access, setup_metrics
from app.integrations.competition_feed import router as competition_feed_router
from app.integrations.sai_sync import router as sai_sync_router
from app.injury.router import router as injury_router
from app.ml.router import router as ml_router
from app.performance.router import router as performance_router
from app.uadp.router import router as uadp_router

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        reset_log_context()
        bind_log_context(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        bind_log_context(request_id=request_id)
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            try:
                payload = decode_token(auth_header.split(" ", 1)[1])
                bind_log_context(user_id=payload.get("sub"), athlete_id=payload.get("athlete_id"))
            except Exception:
                pass

        if request.url.path == "/metrics":
            require_internal_metrics_access(request)

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            endpoint = getattr(request.scope.get("route"), "path", request.url.path)
            bind_log_context(endpoint=endpoint, status_code=500, duration_ms=duration_ms, error=str(exc))
            logger.exception("request_failed")
            observe_request_metrics(request, 500, duration_ms / 1000)
            raise

        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        endpoint = getattr(request.scope.get("route"), "path", request.url.path)
        bind_log_context(endpoint=endpoint, status_code=response.status_code, duration_ms=duration_ms)
        logger.info("request_completed")
        observe_request_metrics(request, response.status_code, duration_ms / 1000)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/health", "/metrics"}:
            return await call_next(request)
        redis_client = get_redis_client()
        client_host = request.client.host if request.client else "anonymous"
        identity = client_host or "anonymous"
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            try:
                payload = decode_token(auth_header.split(" ", 1)[1])
                identity = payload.get("sub") or payload.get("athlete_id") or identity
            except Exception:
                identity = client_host or "anonymous"
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
    configure_logging()
    app = FastAPI(title=settings.app_name, version=settings.app_version)
    setup_metrics(app)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
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
    app.include_router(files_router, prefix="/api/v1/files")
    app.include_router(ml_router, prefix="/api/v1/ml")
    app.include_router(auth_router, prefix="/api/v1/auth")
    app.include_router(sai_sync_router, prefix="/api/v1/integrations")
    app.include_router(competition_feed_router, prefix="/api/v1/integrations")

    @app.get("/health")
    async def health() -> JSONResponse:
        payload, status_code = await build_health_payload()
        return JSONResponse(status_code=status_code, content=payload)

    if settings.debug or settings.app_env == "test":
        @app.get("/debug/sentry-test")
        async def sentry_test() -> None:
            raise RuntimeError("Intentional Sentry test exception")

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
