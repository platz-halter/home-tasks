import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.takeover import TakeoverRepository
from app.schemas.takeover import TakeoverRequestCreate, TakeoverRequestResponse
from app.services.takeover import TakeoverService

router = APIRouter(prefix="/takeover", tags=["takeover"])


@router.post("/{instance_id}", response_model=TakeoverRequestResponse, status_code=201)
async def create_takeover_request(
    instance_id: uuid.UUID,
    data: TakeoverRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TakeoverService(db)
    return await service.create_request(instance_id, data.requested_to_id, current_user)


@router.post("/requests/{request_id}/accept", response_model=TakeoverRequestResponse)
async def accept_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TakeoverService(db)
    return await service.respond_to_request(
        request_id, accept=True, current_user=current_user
    )


@router.post("/requests/{request_id}/decline", response_model=TakeoverRequestResponse)
async def decline_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TakeoverService(db)
    return await service.respond_to_request(
        request_id, accept=False, current_user=current_user
    )


@router.post("/requests/{request_id}/cancel", response_model=TakeoverRequestResponse)
async def cancel_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TakeoverService(db)
    return await service.cancel_request(request_id, current_user)


@router.get("/requests/incoming", response_model=list[TakeoverRequestResponse])
async def incoming_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = TakeoverRepository(db)
    return await repo.get_pending_for_user(current_user.id)


@router.get("/requests/sent", response_model=list[TakeoverRequestResponse])
async def sent_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = TakeoverRepository(db)
    return await repo.get_sent_by_user(current_user.id)
