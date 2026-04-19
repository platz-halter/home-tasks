import logging

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.chore_instance import ChoreInstance, InstanceStatus
from app.services.push import send_push_to_user

logger = logging.getLogger(__name__)


async def send_daily_reminders() -> None:
    logger.info("Sending daily reminders")
    async with AsyncSessionLocal() as session:
        try:
            # Get all users with pending assigned chores
            result = await session.execute(
                select(ChoreInstance).where(
                    ChoreInstance.status.in_(
                        [InstanceStatus.PENDING, InstanceStatus.CLAIMED]
                    ),
                    ChoreInstance.assigned_to_id.isnot(None),
                )
            )
            instances = list(result.scalars().all())

            # Group by user
            user_chores: dict = {}
            for instance in instances:
                uid = instance.assigned_to_id
                user_chores.setdefault(uid, []).append(instance)

            for user_id, chores in user_chores.items():
                await send_push_to_user(
                    session,
                    user_id,
                    "HomeQuest Reminder",
                    f"You have {len(chores)} chore{'s' if len(chores) > 1 else ''} waiting.",
                )

            await session.commit()
        except Exception as e:
            logger.error(f"Daily reminder job failed: {e}")
