import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chore_instance import InstanceStatus
from app.models.takeover_request import TakeoverStatus
from app.models.user import User
from app.repositories.chore import ChoreInstanceRepository
from app.repositories.takeover import TakeoverRepository


class TakeoverService:
    def __init__(self, db: AsyncSession):
        self.takeover_repo = TakeoverRepository(db)
        self.instance_repo = ChoreInstanceRepository(db)

    async def create_request(
        self, instance_id: uuid.UUID, requested_to_id: uuid.UUID, current_user: User
    ) -> object:
        instance = await self.instance_repo.get_by_id(instance_id)

        if not instance:
            raise HTTPException(status_code=404, detail="Chore instance not found")

        if instance.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="You are not assigned to this chore"
            )
        if instance.status == InstanceStatus.COMPLETED:
            raise HTTPException(status_code=409, detail="Chore is already completed")
        if requested_to_id == current_user.id:
            raise HTTPException(
                status_code=400, detail="Cannot request takeover to yourself"
            )

        return await self.takeover_repo.create(
            instance_id=instance_id,
            requested_by_id=current_user.id,
            requested_to_id=requested_to_id,
        )

    async def respond_to_request(
        self, request_id: uuid.UUID, accept: bool, current_user: User
    ) -> object:
        request = await self.takeover_repo.get_by_id(request_id)

        if not request:
            raise HTTPException(status_code=404, detail="Takeover request not found")
        if request.requested_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="This request is not for you")
        if request.status != TakeoverStatus.PENDING:
            raise HTTPException(status_code=409, detail="Request is no longer pending")

        new_status = TakeoverStatus.ACCEPTED if accept else TakeoverStatus.DECLINED
        updated = await self.takeover_repo.update(request, status=new_status)

        if accept:
            instance = await self.instance_repo.get_by_id(request.instance_id)

            if not instance:
                raise HTTPException(status_code=404, detail="Instance not found")

            await self.instance_repo.update(
                instance,
                assigned_to_id=current_user.id,
                status=InstanceStatus.CLAIMED,
                claimed_by_id=current_user.id,
            )
        return updated

    async def cancel_request(self, request_id: uuid.UUID, current_user: User) -> object:
        request = await self.takeover_repo.get_by_id(request_id)

        if not request:
            raise HTTPException(status_code=404, detail="Takeover request not found")
        if request.requested_by_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="You did not create this request"
            )
        if request.status != TakeoverStatus.PENDING:
            raise HTTPException(status_code=409, detail="Request is no longer pending")
        return await self.takeover_repo.update(request, status=TakeoverStatus.CANCELLED)
