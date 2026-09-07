from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    database_url: str = f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'data' / 'app.db'}"
    cors_origins: str = "http://localhost:3000"
    cors_origin_regex: str | None = None
    log_level: str = "INFO"
    default_user_name: str = "Naresh"
    seed_on_start: bool = False


settings = Settings()