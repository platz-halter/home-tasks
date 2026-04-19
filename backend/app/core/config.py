from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_NAME: str = "ChoreQuest"
    DEBUG: bool = True
    SECRET_KEY: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:80"]

    # Database
    DATABASE_URL: str

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Household
    WEEKLY_POINTS_GOAL: int = 100

    # Push notifications
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "mailto:admin@homequest.local"


settings = Settings()
