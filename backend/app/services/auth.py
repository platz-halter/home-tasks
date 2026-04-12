from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: UserCreate) -> User:
        if await self.repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        if await self.repo.get_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
            )
        return await self.repo.create(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
        )

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        user = await self.repo.get_by_id(payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )
