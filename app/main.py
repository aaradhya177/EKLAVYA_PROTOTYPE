from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.consent import ConsentEnforcementMiddleware
from app.core.responses import error_response
from app.injury.router import router as injury_router
from app.performance.router import router as performance_router
from app.uadp.router import router as uadp_router


def create_app() -> FastAPI:
    app = FastAPI(title="AthleteOS")
    app.add_middleware(ConsentEnforcementMiddleware)
    app.include_router(uadp_router, prefix="")
    app.include_router(performance_router, prefix="")
    app.include_router(injury_router, prefix="")

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

    return app


app = create_app()
