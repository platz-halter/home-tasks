import uuid

from pydantic import BaseModel


class WeeklyStatsResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    weekly_points: int
    weekly_goal: int
    completion_percentage: float
    completed_chores: int
    is_break_mode: bool


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    username: str
    avatar_path: str | None
    weekly_points: int
    total_points: int


class LeaderboardResponse(BaseModel):
    week_start: str
    entries: list[LeaderboardEntry]
