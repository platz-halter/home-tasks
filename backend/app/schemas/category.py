import uuid

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon_slug: str = Field(min_length=1, max_length=50)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    icon_slug: str | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon_slug: str
    color: str

    model_config = {"from_attributes": True}
