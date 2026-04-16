import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.takeover_request import TakeoverRequest, TakeoverStatus


class TakeoverRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, request_id: uuid.UUID) -> TakeoverRequest | None:
        result = await self.db.execute(
            select(TakeoverRequest).where(TakeoverRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_pending_for_user(self, user_id: uuid.UUID) -> list[TakeoverRequest]:
        result = await self.db.execute(
            select(TakeoverRequest).where(
                TakeoverRequest.requested_to_id == user_id,
                TakeoverRequest.status == TakeoverStatus.PENDING,
            )
        )
        return list(result.scalars().all())

    async def get_sent_by_user(self, user_id: uuid.UUID) -> list[TakeoverRequest]:
        result = await self.db.execute(
            select(TakeoverRequest).where(TakeoverRequest.requested_by_id == user_id)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> TakeoverRequest:
        request = TakeoverRequest(**kwargs)

        self.db.add(request)
        await self.db.flush()
        await self.db.refresh(request)
        return request

    async def update(self, request: TakeoverRequest, **kwargs) -> TakeoverRequest:
        for key, value in kwargs.items():
            setattr(request, key, value)
        await self.db.flush()
        await self.db.refresh(request)
        return request
