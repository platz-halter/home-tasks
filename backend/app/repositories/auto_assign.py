import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auto_assign_exception import AutoAssignException


class AutoAssignExceptionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_exceptions_for_template(
        self, template_id: uuid.UUID
    ) -> list[uuid.UUID]:
        result = await self.db.execute(
            select(AutoAssignException.user_id).where(
                AutoAssignException.template_id == template_id
            )
        )
        return list(result.scalars().all())

    async def create(
        self, user_id: uuid.UUID, template_id: uuid.UUID
    ) -> AutoAssignException:
        exception = AutoAssignException(user_id=user_id, template_id=template_id)
        self.db.add(exception)
        await self.db.flush()
        await self.db.refresh(exception)
        return exception

    async def delete(self, user_id: uuid.UUID, template_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(AutoAssignException).where(
                AutoAssignException.user_id == user_id,
                AutoAssignException.template_id == template_id,
            )
        )
        exception = result.scalar_one_or_none()
        if exception:
            await self.db.delete(exception)
            await self.db.flush()
