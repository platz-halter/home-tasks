import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.auto_assign_exception import AutoAssignException
from app.models.chore_instance import ChoreInstance, InstanceStatus
from app.models.chore_template import ChoreTemplate, RecurrenceType
from app.models.user import User
from app.models.weekly_points import WeeklyPoints

logger = logging.getLogger(__name__)


def get_current_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


async def generate_recurring_instances() -> None:
    logger.info("Running chore scheduler job")

    async with AsyncSessionLocal() as session:
        try:
            # Fetch active recurring templates
            result = await session.execute(
                select(ChoreTemplate).where(
                    ChoreTemplate.is_active.is_(True),
                    ChoreTemplate.recurrence != RecurrenceType.ONCE,
                )
            )
            templates = list(result.scalars().all())

            # Fetch active non-break users
            users_result = await session.execute(
                select(User).where(
                    User.is_active.is_(True),
                    User.break_mode.is_(False),
                )
            )
            active_users = list(users_result.scalars().all())

            if not active_users:
                logger.info("No active users to assign chores to")
                return

            # Fetch weekly points for all active users
            week_start = get_current_week_start()
            points_result = await session.execute(
                select(WeeklyPoints).where(WeeklyPoints.week_start == week_start)
            )
            points_map = {r.user_id: r.points for r in points_result.scalars().all()}

            now = datetime.now(timezone.utc)

            for template in templates:
                # Determine cycle start
                if template.recurrence == RecurrenceType.WEEKLY:
                    cycle_start = now - timedelta(days=now.weekday())
                    cycle_start = cycle_start.replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                elif template.recurrence == RecurrenceType.MONTHLY:
                    cycle_start = now.replace(
                        day=1, hour=0, minute=0, second=0, microsecond=0
                    )
                else:
                    continue

                # Skip if instance already exists for this cycle
                existing = await session.execute(
                    select(ChoreInstance).where(
                        ChoreInstance.template_id == template.id,
                        ChoreInstance.created_at >= cycle_start,
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                # Get users excluded from auto-assignment for this template
                exceptions_result = await session.execute(
                    select(AutoAssignException.user_id).where(
                        AutoAssignException.template_id == template.id
                    )
                )
                excluded_ids = set(exceptions_result.scalars().all())

                eligible_users = [u for u in active_users if u.id not in excluded_ids]
                if not eligible_users:
                    eligible_users = active_users  # fallback: ignore exceptions

                # Assign to user with fewest weekly points
                assigned_user = min(
                    eligible_users, key=lambda u: points_map.get(u.id, 0)
                )

                due_date = None
                if template.suggested_duration_days:
                    due_date = now + timedelta(days=template.suggested_duration_days)

                instance = ChoreInstance(
                    template_id=template.id,
                    assigned_to_id=assigned_user.id,
                    status=InstanceStatus.PENDING,
                    due_date=due_date,
                )
                session.add(instance)
                logger.info(f"Assigned '{template.name}' to {assigned_user.username}")

            await session.commit()
            logger.info("Chore scheduler job complete")

        except Exception as e:
            await session.rollback()
            logger.error(f"Chore scheduler job failed: {e}")
