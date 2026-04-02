from app.gateway.app import create_gateway_app


def create_app():
    return create_gateway_app()


app = create_gateway_app()
