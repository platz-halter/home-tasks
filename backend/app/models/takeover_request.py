import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TakeoverStatus(str, enum.Enum):
    PENDING = ("pending",)
    ACCEPTED = ("accepted",)
    DECLINED = ("declined",)
    CANCELLED = ("cancelled",)


class TakeoverRequest(Base):
    __tablename__ = "takeover_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    instance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chore_instances.id", ondelete="CASCADE"),
        nullable=False,
    )

    requested_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    requested_to_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[TakeoverStatus] = mapped_column(
        Enum(TakeoverStatus), default=TakeoverStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    instance = relationship("ChoreInstance", backref="takeover_requests")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    requested_to = relationship("User", foreign_keys=[requested_to_id])
