import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chore_instance import InstanceStatus
from app.models.chore_template import DifficultyLevel
from app.models.user import User
from app.repositories.chore import ChoreInstanceRepository, ChoreTemplateRepository
from app.schemas.chore import (
    ChoreCompleteRequest,
    ChoreTemplateCreate,
    ChoreTemplateUpdate,
)

DIFFICULTY_MULTIPLIERS = {
    DifficultyLevel.NORMAL: 1.0,
    DifficultyLevel.HARD: 1.5,
    DifficultyLevel.EXTREME: 2.0,
}


class ChoreService:
    def __init__(self, db: AsyncSession):
        self.template_repo = ChoreTemplateRepository(db)
        self.instance_repo = ChoreInstanceRepository(db)

    async def create_template(self, data: ChoreTemplateCreate) -> object:
        if data.category_id:
            from app.repositories.category import CategoryRepository

            category = await CategoryRepository(self.template_repo.db).get_by_id(
                data.category_id
            )
            if not category:
                raise HTTPException(status_code=404, detail="Category not found!")

        return await self.template_repo.create(**data.model_dump())

    async def update_template(
        self, template_id: uuid.UUID, data: ChoreTemplateUpdate
    ) -> object:
        template = await self.template_repo.get_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Chore not found")
        return await self.template_repo.update(
            template, **data.model_dump(exclude_none=True)
        )

    async def delete_template(self, template_id: uuid.UUID) -> None:
        template = await self.template_repo.get_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Chore not found")
        await self.template_repo.delete(template)

    async def spawn_instance(
        self,
        template_id: uuid.UUID,
        assigned_to_id: uuid.UUID | None = None,
    ) -> object:
        template = await self.template_repo.get_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Chore template not found")

        due_date = None
        if template.suggested_duration_days:
            due_date = datetime.now(timezone.utc) + timedelta(
                days=template.suggested_duration_days
            )

        return await self.instance_repo.create(
            template_id=template_id,
            assigned_to_id=assigned_to_id,
            due_date=due_date,
        )

    async def assign_instance(
        self, instance_id: uuid.UUID, user_id: uuid.UUID
    ) -> object:
        instance = await self.instance_repo.get_by_id(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Chore instance not found")
        return await self.instance_repo.update(instance, assigned_to_id=user_id)

    async def claim_instance(self, instance_id: uuid.UUID, user: User) -> object:
        instance = await self.instance_repo.get_by_id(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Chore instance not found")
        if instance.status != InstanceStatus.PENDING:
            raise HTTPException(
                status_code=409, detail="Chore is already claimed or completed"
            )
        return await self.instance_repo.update(
            instance,
            claimed_by_id=user.id,
            assigned_to_id=user.id,
            status=InstanceStatus.CLAIMED,
        )

    async def complete_instance(
        self,
        instance_id: uuid.UUID,
        user: User,
        data: ChoreCompleteRequest,
    ) -> object:
        instance = await self.instance_repo.get_by_id(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Chore instance not found")
        if instance.status == InstanceStatus.COMPLETED:
            raise HTTPException(status_code=409, detail="Chore already completed")

        template = await self.template_repo.get_by_id(instance.template_id)
        multiplier = DIFFICULTY_MULTIPLIERS[data.difficulty]

        points = int(template.base_points * multiplier)

        user.total_points += points

        from app.repositories.stats import StatsRepository

        await StatsRepository(self.instance_repo.db).add_points(user.id, points)

        return await self.instance_repo.update(
            instance,
            status=InstanceStatus.COMPLETED,
            completed_by_id=user.id,
            completed_at=datetime.now(timezone.utc),
            points_awarded=points,
        )
