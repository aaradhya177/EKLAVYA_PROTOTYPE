from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    db_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/athleteos"
    celery_broker_url: str = "memory://"
    celery_result_backend: str = "cache+memory://"
    celery_task_always_eager: bool = False


settings = Settings()
