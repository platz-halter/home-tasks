import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InstanceStatus(str, enum.Enum):
    PENDING = "pending"
    CLAIMED = "claimed"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class ChoreInstance(Base):
    __tablename__ = "chore_instances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Template reference
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chore_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    template = relationship("ChoreTemplate", back_populates="instances")

    # Assignment
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_to = relationship(
        "User", foreign_keys=[assigned_to_id], backref="assigned_chores"
    )

    # Claiming
    claimed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    claimed_by = relationship(
        "User", foreign_keys=[claimed_by_id], backref="claimed_chores"
    )

    # Completion
    completed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    completed_by = relationship(
        "User", foreign_keys=[completed_by_id], backref="completed_chores"
    )

    status: Mapped[InstanceStatus] = mapped_column(
        Enum(InstanceStatus), default=InstanceStatus.PENDING
    )

    # Points awarded (calculated at completion based on difficulty)
    points_awarded: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Dates
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
