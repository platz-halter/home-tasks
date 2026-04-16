from fastapi import APIRouter

from app.api.v1 import auth, categories, chores, stats, takeover, users

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(categories.router)
router.include_router(chores.router)
router.include_router(takeover.router)
router.include_router(stats.router)
