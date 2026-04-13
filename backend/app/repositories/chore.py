import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chore_instance import ChoreInstance, InstanceStatus
from app.models.chore_template import ChoreTemplate


class ChoreTemplateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, active_only: bool = False) -> list[ChoreTemplate]:
        query = select(ChoreTemplate)
        if active_only:
            query = query.where(ChoreTemplate.is_active._is(True))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, template_id: uuid.UUID) -> ChoreTemplate | None:
        result = await self.db.execute(
            select(ChoreTemplate).where(ChoreTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> ChoreTemplate:
        template = ChoreTemplate(**kwargs)
        self.db.add(template)
        await self.db.flush()
        await self.db.refresh(template)
        return template

    async def update(self, template: ChoreTemplate, **kwargs) -> ChoreTemplate:
        for key, value in kwargs.items():
            if value is not None:
                setattr(template, key, value)
        await self.db.flush()
        await self.db.refresh(template)
        return template

    async def delete(self, template: ChoreTemplate) -> None:
        await self.db.delete(template)
        await self.db.flush()


class ChoreInstanceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, instance_id: uuid.UUID) -> ChoreInstance | None:
        result = await self.db.execute(
            select(ChoreInstance).where(ChoreInstance.id == instance_id)
        )
        return result.scalar_one_or_none()

    async def get_pending(self) -> list[ChoreInstance]:
        result = await self.db.execute(
            select(ChoreInstance).where(ChoreInstance.status == InstanceStatus.PENDING)
        )
        return list(result.scalars().all())

    async def get_for_user(self, user_id: uuid.UUID) -> list[ChoreInstance]:
        result = await self.db.execute(
            select(ChoreInstance).where(ChoreInstance.assigned_to_id == user_id)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> ChoreInstance:
        instance = ChoreInstance(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ChoreInstance, **kwargs) -> ChoreInstance:
        for key, value in kwargs.items():
            setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance
