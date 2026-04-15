import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.chore_instance import ChoreInstance, InstanceStatus
from app.models.chore_template import ChoreTemplate, RecurrenceType

logger = logging.getLogger(__name__)


# Run at midnight, check for already existing instance
async def generate_recurring_instances() -> None:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(ChoreTemplate).where(
                    ChoreTemplate.is_active.is_(True),
                    ChoreTemplate.recurrence != RecurrenceType.ONCE,
                )
            )
            templates = list(result.scalars().all())

            now = datetime.now(timezone.utc)

            # Determine start of the current cycle
            for template in templates:
                if template.recurrence == RecurrenceType.WEEKLY:
                    cycle_start = now - timedelta(days=now.weekday())  # Monday
                    cycle_start = cycle_start.replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                elif template.recurrence == RecurrenceType.MONTHLY:
                    cycle_start = now.replace(
                        day=1, hour=0, minute=0, second=0, microsecond=0
                    )
                else:
                    continue

                # Check for existing instances
                existing = await session.execute(
                    select(ChoreInstance).where(
                        ChoreInstance.template_id == template.id,
                        ChoreInstance.created_at >= cycle_start,
                    )
                )
                if existing.scalar_one_or_none():
                    continue  # Instance already exists

                # Calculate due date
                if template.suggested_duration_days:
                    due_date = now + timedelta(days=template.suggested_duration_days)

                # Create instance

                instance = ChoreInstance(
                    template_id=template.id,
                    status=InstanceStatus.PENDING,
                    due_date=due_date,
                )
                session.add(instance)
                logger.info(f"Generated instance for template: {template.name}")

            await session.commit()
            logger.info("Chore scheduler job completed")

        except Exception as e:
            await session.rollback()
            logger.error(f"Chore scheduler job failed: {e}")
