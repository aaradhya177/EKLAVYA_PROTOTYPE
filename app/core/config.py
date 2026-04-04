from __future__ import annotations

import sys
import tempfile
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_env_files() -> tuple[str, ...]:
    files: list[str] = []
    if Path(".env.development").exists():
        files.append(".env.development")
    if Path(".env").exists():
        files.append(".env")
    if "pytest" in sys.modules and Path(".env.test").exists():
        files.append(".env.test")
    return tuple(files) or (".env",)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_default_env_files(),
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "AthleteOS"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str

    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"
    CELERY_TASK_ALWAYS_EAGER: bool = False

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    S3_ENDPOINT_URL: str = ""
    S3_BUCKET_NAME: str = "athleteos"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    FILE_STORAGE_PATH: str = str(Path(tempfile.gettempdir()) / "athleteos_files")

    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@athleteos.in"

    FIREBASE_CREDENTIALS_PATH: str = ""

    MODELS_DIR: str = "/models"
    ML_MIN_AUC_THRESHOLD: float = 0.65

    SENTRY_DSN: str = ""
    SLACK_WEBHOOK_URL: str = ""

    RATE_LIMIT_PER_MINUTE: int = 100
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:19006"
    INJURY_KEYWORDS_CONFIG: str = "app/files/config/injury_keywords.yaml"

    @field_validator("DEBUG", "CELERY_TASK_ALWAYS_EAGER", mode="before")
    @classmethod
    def _coerce_bool_strings(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on"}:
                return True
            if normalized in {"0", "false", "no", "off", "release"}:
                return False
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def app_name(self) -> str:
        return self.APP_NAME

    @property
    def app_env(self) -> str:
        return self.APP_ENV

    @app_env.setter
    def app_env(self, value: str) -> None:
        self.APP_ENV = value

    @property
    def app_version(self) -> str:
        return self.APP_VERSION

    @property
    def debug(self) -> bool:
        return self.DEBUG

    @debug.setter
    def debug(self, value: bool) -> None:
        self.DEBUG = value

    @property
    def db_url(self) -> str:
        return self.DATABASE_URL

    @db_url.setter
    def db_url(self, value: str) -> None:
        self.DATABASE_URL = value

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL

    @redis_url.setter
    def redis_url(self, value: str) -> None:
        self.REDIS_URL = value

    @property
    def celery_broker_url(self) -> str:
        return self.CELERY_BROKER_URL

    @celery_broker_url.setter
    def celery_broker_url(self, value: str) -> None:
        self.CELERY_BROKER_URL = value

    @property
    def celery_result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND

    @celery_result_backend.setter
    def celery_result_backend(self, value: str) -> None:
        self.CELERY_RESULT_BACKEND = value

    @property
    def celery_task_always_eager(self) -> bool:
        return self.CELERY_TASK_ALWAYS_EAGER

    @celery_task_always_eager.setter
    def celery_task_always_eager(self, value: bool) -> None:
        self.CELERY_TASK_ALWAYS_EAGER = value

    @property
    def jwt_secret_key(self) -> str:
        return self.JWT_SECRET_KEY

    @jwt_secret_key.setter
    def jwt_secret_key(self, value: str) -> None:
        self.JWT_SECRET_KEY = value

    @property
    def jwt_algorithm(self) -> str:
        return self.JWT_ALGORITHM

    @property
    def access_token_expire_minutes(self) -> int:
        return self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

    @property
    def refresh_token_expire_days(self) -> int:
        return self.JWT_REFRESH_TOKEN_EXPIRE_DAYS

    @property
    def rate_limit_per_minute(self) -> int:
        return self.RATE_LIMIT_PER_MINUTE

    @rate_limit_per_minute.setter
    def rate_limit_per_minute(self, value: int) -> None:
        self.RATE_LIMIT_PER_MINUTE = value

    @property
    def s3_endpoint_url(self) -> str | None:
        return self.S3_ENDPOINT_URL or None

    @s3_endpoint_url.setter
    def s3_endpoint_url(self, value: str | None) -> None:
        self.S3_ENDPOINT_URL = value or ""

    @property
    def s3_bucket(self) -> str:
        return self.S3_BUCKET_NAME

    @property
    def s3_access_key_id(self) -> str:
        return self.S3_ACCESS_KEY

    @property
    def s3_secret_access_key(self) -> str:
        return self.S3_SECRET_KEY

    @property
    def aws_region(self) -> str:
        return self.AWS_REGION

    @property
    def file_storage_path(self) -> str:
        return self.FILE_STORAGE_PATH

    @file_storage_path.setter
    def file_storage_path(self, value: str) -> None:
        self.FILE_STORAGE_PATH = value

    @property
    def injury_keywords_config(self) -> str:
        return self.INJURY_KEYWORDS_CONFIG

    @property
    def models_dir(self) -> str:
        return self.MODELS_DIR


settings = Settings()
