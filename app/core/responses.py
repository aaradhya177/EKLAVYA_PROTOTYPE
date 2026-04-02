from typing import Any


def success_response(data: Any = None, message: str = "Success") -> dict[str, Any]:
    return {"status": "ok", "data": data, "message": message}


def error_response(message: str, data: Any = None) -> dict[str, Any]:
    return {"status": "error", "data": data, "message": message}
