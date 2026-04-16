import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WeeklyPoints(Base):
    __tablename__ = "weekly_points"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", backref="weekly_points")

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_weekly_points_user_week"),
    )
