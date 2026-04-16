import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RecurrenceType(str, enum.Enum):
    ONCE = "once"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class DifficultyLevel(str, enum.Enum):
    NORMAL = "normal"
    HARD = "hard"
    EXTREME = "extreme"


class ChoreTemplate(Base):
    __tablename__ = "chore_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Category
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    category = relationship("Category", back_populates="chores")

    # Points and difficulty
    base_points: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel), default=DifficultyLevel.NORMAL
    )

    # Scheduling
    recurrence: Mapped[RecurrenceType] = mapped_column(
        Enum(RecurrenceType), default=RecurrenceType.ONCE
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Soft deadline (days after generation to suggest completion)
    suggested_duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    instances = relationship("ChoreInstance", back_populates="template")
