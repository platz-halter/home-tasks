import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.chore_instance import InstanceStatus
from app.models.chore_template import DifficultyLevel, RecurrenceType

# --- Template schemas ---


class ChoreTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    category_id: uuid.UUID | None = None
    base_points: int = Field(default=10, ge=1, le=1000)
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL
    recurrence: RecurrenceType = RecurrenceType.ONCE
    suggested_duration_days: int | None = Field(default=None, ge=1, le=365)


class ChoreTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    category_id: uuid.UUID | None = None
    base_points: int | None = Field(default=None, ge=1, le=1000)
    difficulty: DifficultyLevel | None = None
    recurrence: RecurrenceType | None = None
    suggested_duration_days: int | None = None
    is_active: bool | None = None


class ChoreTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category_id: uuid.UUID | None
    base_points: int
    difficulty: DifficultyLevel
    recurrence: RecurrenceType
    suggested_duration_days: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Instance schemas ---


class ChoreInstanceResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    assigned_to_id: uuid.UUID | None
    claimed_by_id: uuid.UUID | None
    completed_by_id: uuid.UUID | None
    status: InstanceStatus
    points_awarded: int | None
    due_date: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChoreAssignRequest(BaseModel):
    user_id: uuid.UUID


class ChoreCompleteRequest(BaseModel):
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL


class BulkCompleteRequest(BaseModel):
    instance_ids: list[uuid.UUID] = Field(min_length=1)
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL
