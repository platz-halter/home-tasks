from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.stats import StatsRepository, get_current_week_start
from app.schemas.stats import LeaderboardEntry, LeaderboardResponse, WeeklyStatsResponse


class StatsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.stats_repo = StatsRepository(db)

    async def get_weekly_stats(self, user: User) -> WeeklyStatsResponse:
        from app.core.config import settings

        week_start = get_current_week_start()
        weekly_record = await self.stats_repo.get_weekly_points(user.id, week_start)
        weekly_points = weekly_record.points if weekly_record else 0
        completed_count = await self.stats_repo.get_completed_count_this_week(user.id)
        goal = settings.WEEKLY_POINTS_GOAL
        percentage = min((weekly_points / goal) * 100, 100.0) if goal > 0 else 0.0

        return WeeklyStatsResponse(
            user_id=user.id,
            username=user.username,
            weekly_points=weekly_points,
            weekly_goal=goal,
            completion_percentage=round(percentage, 1),
            completed_chores=completed_count,
            is_break_mode=user.break_mode,
        )

    async def get_leaderboard(self) -> LeaderboardResponse:
        week_start = get_current_week_start()
        weekly_records = await self.stats_repo.get_all_users_weekly_points(week_start)

        # Get all non-break-mode users
        result = await self.db.execute(
            select(User).where(User.break_mode.is_(False), User.is_active.is_(True))
        )
        active_users = {u.id: u for u in result.scalars().all()}

        points_map = {r.user_id: r.points for r in weekly_records}

        entries = []
        for user_id, user in active_users.items():
            entries.append(
                LeaderboardEntry(
                    rank=0,
                    user_id=user.id,
                    username=user.username,
                    avatar_path=user.avatar_path,
                    weekly_points=points_map.get(user_id, 0),
                    total_points=user.total_points,
                )
            )

        entries.sort(key=lambda e: e.weekly_points, reverse=True)
        for i, entry in enumerate(entries):
            entry.rank = i + 1

        return LeaderboardResponse(
            week_start=str(week_start),
            entries=entries,
        )
