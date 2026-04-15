from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.jobs.chore_scheduler import generate_recurring_instances

scheduler = AsyncIOScheduler()


def start_scheduler():
    scheduler.add_job(
        generate_recurring_instances,
        trigger=CronTrigger(hour=0, minute=0),
        id="generate_recurring_instances",
    )


def stop_scheduler():
    scheduler.shutdown()
