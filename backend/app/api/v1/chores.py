import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.jobs.chore_scheduler import generate_recurring_instances
from app.models.user import User
from app.repositories.auto_assign import AutoAssignExceptionRepository
from app.repositories.chore import ChoreInstanceRepository, ChoreTemplateRepository
from app.schemas.chore import (
    BulkCompleteRequest,
    ChoreAssignRequest,
    ChoreCompleteRequest,
    ChoreInstanceResponse,
    ChoreTemplateCreate,
    ChoreTemplateResponse,
    ChoreTemplateUpdate,
)
from app.services.chore import ChoreService

router = APIRouter(prefix="/chores", tags=["chores"])


@router.post("/instances/bulk-complete", status_code=200)
async def bulk_complete(
    data: BulkCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChoreService(db)
    results = []
    for instance_id in data.instance_ids:
        instance = await service.complete_instance(
            instance_id,
            current_user,
            ChoreCompleteRequest(difficulty=data.difficulty),
        )
        results.append(instance)
    return {"completed": len(results)}


@router.post("/{template_id}/exceptions/{user_id}", status_code=201)
async def add_exception(
    template_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = AutoAssignExceptionRepository(db)
    await repo.create(user_id=user_id, template_id=template_id)
    return {"status": "exception added"}


@router.delete("/{template_id}/exceptions/{user_id}", status_code=204)
async def remove_exception(
    template_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = AutoAssignExceptionRepository(db)
    await repo.delete(user_id=user_id, template_id=template_id)


@router.get("", response_model=list[ChoreTemplateResponse])
async def list_chores(
    db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
):
    repo = ChoreTemplateRepository(db)
    return await repo.get_all()


@router.post("", response_model=ChoreTemplateResponse, status_code=201)
async def create_chore(
    data: ChoreTemplateCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.create_template(data)


@router.patch("/{template_id}", response_model=ChoreTemplateResponse)
async def update_chore(
    template_id: uuid.UUID,
    data: ChoreTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.update_template(template_id, data)


@router.delete("/{template_id}", status_code=204)
async def delete_chore(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = ChoreService(db)
    await service.delete_template(template_id)


@router.post(
    "/{template_id}/spawn", response_model=ChoreInstanceResponse, status_code=201
)
async def spawn_instance(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.spawn_instance(template_id)


@router.post("/instances/{instance_id}/assign", response_model=ChoreInstanceResponse)
async def assign_instance(
    instance_id: uuid.UUID,
    data: ChoreAssignRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.assign_instance(instance_id, data.user_id)


@router.post("/instances/{instance_id}/claim", response_model=ChoreInstanceResponse)
async def claim_instance(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.claim_instance(instance_id, current_user)


@router.post("/instances/{instance_id}/complete", response_model=ChoreInstanceResponse)
async def complete_instance(
    instance_id: uuid.UUID,
    data: ChoreCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChoreService(db)
    return await service.complete_instance(instance_id, current_user, data)


@router.get("/instances/pending", response_model=list[ChoreInstanceResponse])
async def list_pending(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = ChoreInstanceRepository(db)
    return await repo.get_pending()


@router.get("/instances/mine", response_model=list[ChoreInstanceResponse])
async def list_mine(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ChoreInstanceRepository(db)
    return await repo.get_for_user(current_user.id)


@router.post("/scheduler/run", status_code=200)
async def trigger_scheduler(_: User = Depends(get_current_user)):
    await generate_recurring_instances()
    return {"status": "scheduler run complete"}
