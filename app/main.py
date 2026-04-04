from app.core.config import settings
from app.core.sentry import init_sentry
from app.gateway.app import create_gateway_app


def create_app():
    return create_gateway_app()


if settings.SENTRY_DSN:
    init_sentry()

app = create_gateway_app()
