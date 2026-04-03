from pydantic_settings import BaseSettings, SettingsConfigDict
import tempfile
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AthleteOS"
    app_env: str = "development"
    app_version: str = "1.0.0"
    db_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/athleteos"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    celery_task_always_eager: bool = False
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    cors_origins: str = "http://localhost:3000,http://localhost:19006"
    rate_limit_per_minute: int = 100
    s3_endpoint_url: str | None = None
    s3_bucket: str = "athleteos"
    s3_access_key_id: str = "athleteos"
    s3_secret_access_key: str = "athleteos123"
    aws_region: str = "us-east-1"
    file_storage_path: str = str(Path(tempfile.gettempdir()) / "athleteos_files")
    injury_keywords_config: str = "app/files/config/injury_keywords.yaml"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
