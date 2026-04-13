import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Category]:
        result = await self.db.execute(select(Category))
        return list(result.scalars().all())

    async def get_by_id(self, category_id: uuid.UUID) -> Category | None:
        result = await self.db.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Category | None:
        result = await self.db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Category:
        category = Category(**kwargs)
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def update(self, category: Category, **kwargs) -> Category:
        for key, value in kwargs.items():
            if value is not None:
                setattr(category, key, value)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def delete(self, category: Category) -> None:
        await self.db.delete(category)
        await self.db.flush()
