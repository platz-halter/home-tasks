import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    return await repo.get_all()


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CategoryRepository(db)
    if await repo.get_by_name(data.name):
        raise HTTPException(status_code=409, detail="Category already exists")
    return await repo.create(**data.model_dump())


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CategoryRepository(db)
    category = await repo.get_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return await repo.update(category, **data.model_dump(exclude_none=True))


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CategoryRepository(db)
    category = await repo.get_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    await repo.delete(category)
