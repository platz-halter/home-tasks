import logging

from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)


async def send_push_to_user(db: AsyncSession, user_id, title: str, body: str) -> None:
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subscriptions = list(result.scalars().all())

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=f'{{"title": "{title}", "body": "{body}"}}',
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
            )
        except WebPushException as e:
            logger.error(f"Push failed for subscription {sub.id}: {e}")
            # If subscription is expired/invalid, remove it
            if e.response and e.response.status_code in (404, 410):
                await db.delete(sub)
                await db.flush()


async def send_push_to_all(db: AsyncSession, title: str, body: str) -> None:
    result = await db.execute(select(PushSubscription))
    subscriptions = list(result.scalars().all())

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=f'{{"title": "{title}", "body": "{body}"}}',
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
            )
        except WebPushException as e:
            logger.error(f"Push failed: {e}")
            if e.response and e.response.status_code in (404, 410):
                await db.delete(sub)
                await db.flush()
