import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.takeover_request import TakeoverStatus


class TakeoverRequestCreate(BaseModel):
    request_to_id: uuid.UUID


class TakeoverRequestResponse(BaseModel):
    id: uuid.UUID
    instance_id: uuid.UUID
    requested_by_id: uuid.UUID
    requested_to_id: uuid.UUID
    status: TakeoverStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class TakeoverRequestUpdate(BaseModel):
    status: TakeoverStatus
