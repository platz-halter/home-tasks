import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=50)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def username_alpanumeric(cls, v: str) -> str:
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumerical")
        return v


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=50)
    language: str | None = Field(default=None, pattern="^(en|de)$")
    theme: str | None = Field(default=None, pattern="^(light|dark)$")
    break_mode: bool | None = None


class UserResponse(UserBase):
    id: uuid.UUID
    avatar_path: str | None
    language: str
    theme: str
    break_mode: bool
    is_admin: bool
    total_points: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: uuid.UUID
    username: str
    avatar_path: str | None
    total_points: int
    break_mode: bool

    model_config = {"from_attributes": True}
