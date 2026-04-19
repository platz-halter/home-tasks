from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.jobs.chore_scheduler import generate_recurring_instances
from app.jobs.reminder import send_daily_reminders

scheduler = AsyncIOScheduler()


def start_scheduler():
    scheduler.add_job(
        generate_recurring_instances,
        trigger=CronTrigger(hour=0, minute=0),
        id="generate_recurring_instances",
    )
    scheduler.add_job(
        send_daily_reminders,
        trigger=CronTrigger(hour=15, minute=0),
        id="send_daily_reminders",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown()
