from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.push_subscription import PushSubscription
from app.models.user import User

router = APIRouter(prefix="/push", tags=["push"])


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe", status_code=201)
async def subscribe(
    data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if subscription already exists
    existing = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == data.endpoint)
    )
    if existing.scalar_one_or_none():
        return {"status": "already subscribed"}

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=data.endpoint,
        p256dh=data.p256dh,
        auth=data.auth,
    )
    db.add(sub)
    return {"status": "subscribed"}


@router.post("/unsubscribe")
async def unsubscribe(
    data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.endpoint == data.endpoint,
            PushSubscription.user_id == current_user.id,
        )
    )
    sub = result.scalar_one_or_none()
    if sub:
        await db.delete(sub)
    return {"status": "unsubscribed"}


"""
@router.post("/test-all")
async def test_all(
    db: AsyncSession = Depends(get_db),
):
    from app.services.push import send_push_to_all

    await send_push_to_all(db, "HomeQuest", "Push notifications for all")
    return {"status": "sent"}
"""


@router.post("/test")
async def test_push(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.push import send_push_to_user

    await send_push_to_user(
        db, current_user.id, "HomeQuest", "Push notifications are working! 🎉"
    )
    return {"status": "sent"}
