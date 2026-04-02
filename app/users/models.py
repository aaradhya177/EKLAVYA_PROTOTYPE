import enum
import uuid

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserRole(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    federation_admin = "federation_admin"
    sys_admin = "sys_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
