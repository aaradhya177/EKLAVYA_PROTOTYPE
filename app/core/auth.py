from collections.abc import Callable

from fastapi import Header, HTTPException

from app.users.models import UserRole


def require_role(*allowed_roles: UserRole) -> Callable:
    async def dependency(x_role: str | None = Header(default=None)) -> str:
        if x_role is None:
            raise HTTPException(status_code=403, detail="Role header required")
        try:
            role = UserRole(x_role)
        except ValueError as exc:
            raise HTTPException(status_code=403, detail="Invalid role") from exc
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return role.value

    return dependency
