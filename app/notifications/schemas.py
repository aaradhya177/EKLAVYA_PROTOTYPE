from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.notifications.models import DevicePlatform, NotificationChannel, NotificationPriority


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_id: UUID
    notification_type: str
    title: str
    body: str
    channel: NotificationChannel
    priority: NotificationPriority
    is_read: bool
    sent_at: datetime | None
    created_at: datetime
    metadata_json: dict[str, Any] = Field(alias="metadata")


class NotificationPreferenceUpsert(BaseModel):
    notification_type: str
    in_app_enabled: bool = True
    email_enabled: bool = True
    push_enabled: bool = False


class NotificationPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    notification_type: str
    in_app_enabled: bool
    email_enabled: bool
    push_enabled: bool


class DeviceTokenCreate(BaseModel):
    token: str
    platform: DevicePlatform


class DeviceTokenRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    token: str
    platform: DevicePlatform
    created_at: datetime
    last_seen_at: datetime
