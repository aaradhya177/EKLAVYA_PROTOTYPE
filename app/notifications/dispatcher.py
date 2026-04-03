from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.notifications.models import Notification, NotificationChannel, NotificationPreference, NotificationPriority
from app.notifications.tasks import send_email, send_in_app, send_push
from app.notifications.types import DEFAULT_CHANNELS


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class NotificationDispatcher:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _preference_for(self, user_id: UUID, notification_type: str) -> NotificationPreference | None:
        stmt = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            NotificationPreference.notification_type == notification_type,
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def dispatch(
        self,
        recipient_id: UUID,
        notification_type: str,
        context: dict,
        *,
        title: str,
        body: str,
        priority: NotificationPriority = NotificationPriority.medium,
    ) -> list[Notification]:
        preference = await self._preference_for(recipient_id, notification_type)
        channel_flags = {
            "in_app_enabled": preference.in_app_enabled if preference else DEFAULT_CHANNELS["in_app_enabled"],
            "email_enabled": preference.email_enabled if preference else DEFAULT_CHANNELS["email_enabled"],
            "push_enabled": preference.push_enabled if preference else DEFAULT_CHANNELS["push_enabled"],
        }

        notifications: list[Notification] = []
        for channel, enabled in [
            (NotificationChannel.in_app, channel_flags["in_app_enabled"]),
            (NotificationChannel.email, channel_flags["email_enabled"]),
            (NotificationChannel.push, channel_flags["push_enabled"]),
        ]:
            if not enabled:
                continue
            notification = Notification(
                recipient_id=recipient_id,
                notification_type=notification_type,
                title=title,
                body=body,
                channel=channel,
                priority=priority,
                is_read=False,
                sent_at=None,
                created_at=_utcnow(),
                metadata_json=context,
            )
            self.session.add(notification)
            await self.session.flush()
            notifications.append(notification)
            if channel == NotificationChannel.in_app:
                send_in_app.delay(str(notification.id))
            elif channel == NotificationChannel.email:
                send_email.delay(str(notification.id))
            elif channel == NotificationChannel.push:
                send_push.delay(str(notification.id))
        await self.session.commit()
        for item in notifications:
            await self.session.refresh(item)
        return notifications
