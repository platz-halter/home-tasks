import uuid
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chore_instance import ChoreInstance, InstanceStatus
from app.models.weekly_points import WeeklyPoints


def get_current_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


class StatsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_weekly_points(
        self, user_id: uuid.UUID, week_start: date
    ) -> WeeklyPoints | None:
        result = await self.db.execute(
            select(WeeklyPoints).where(
                WeeklyPoints.user_id == user_id,
                WeeklyPoints.week_start == week_start,
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_weekly_points(
        self, user_id: uuid.UUID, week_start: date
    ) -> WeeklyPoints:
        record = await self.get_weekly_points(user_id, week_start)
        if not record:
            record = WeeklyPoints(user_id=user_id, week_start=week_start, points=0)
            self.db.add(record)
            await self.db.flush()
            await self.db.refresh(record)
        return record

    async def add_points(self, user_id: uuid.UUID, points: int) -> WeeklyPoints:
        week_start = get_current_week_start()
        record = await self.get_or_create_weekly_points(user_id, week_start)
        record.points += points
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def get_completed_count_this_week(self, user_id: uuid.UUID) -> int:
        week_start = get_current_week_start()
        week_start_dt = date.fromisoformat(str(week_start))
        result = await self.db.execute(
            select(func.count(ChoreInstance.id)).where(
                ChoreInstance.completed_by_id == user_id,
                ChoreInstance.status == InstanceStatus.COMPLETED,
                func.date(ChoreInstance.completed_at) >= week_start_dt,
            )
        )
        return result.scalar_one() or 0

    async def get_all_users_weekly_points(self, week_start: date) -> list[WeeklyPoints]:
        result = await self.db.execute(
            select(WeeklyPoints).where(WeeklyPoints.week_start == week_start)
        )
        return list(result.scalars().all())
