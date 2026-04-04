from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.auth.service import create_access_token
from app.core import database
from app.core.celery_app import celery_app
from app.core.database import Base
from app.core.redis_client import reset_redis_client
from app.main import create_app
from app.ml import base as ml_base
from app.ml.base import ModelRegistry
from app.ml.injury_model import build_injury_training_dataset, train_injury_classifier
from app.ml.train_injury import train_and_register_injury_model
from app.ml.train_performance import train_and_register_performance_models
from app.seed.seed import seed_database
from app.users.models import User, UserRole

TEST_DB_DIR = Path(tempfile.gettempdir()) / "athleteos-ml-tests"
TEST_DB_DIR.mkdir(exist_ok=True)


@pytest.fixture()
async def seeded_ml_env(monkeypatch):
    db_path = TEST_DB_DIR / f"ml-{uuid4().hex}.db"
    model_dir = TEST_DB_DIR / f"models-{uuid4().hex}"
    model_dir.mkdir(exist_ok=True)

    database.configure_database(f"sqlite+aiosqlite:///{db_path}")
    reset_redis_client()
    celery_app.conf.broker_url = "memory://"
    celery_app.conf.result_backend = "cache+memory://"
    celery_app.conf.task_ignore_result = True
    monkeypatch.setattr(ml_base, "models_dir", lambda: model_dir)

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        await seed_database(session)

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield {"client": client, "db_path": db_path, "model_dir": model_dir}

    await database.engine.dispose()
    reset_redis_client()
    if db_path.exists():
        db_path.unlink()
    shutil.rmtree(model_dir, ignore_errors=True)


async def _get_user_by_role(role: UserRole) -> User:
    async with database.AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.role == role))).scalars().first()
        assert user is not None
        return user


async def test_training_pipeline_runs_end_to_end_on_seeded_data(seeded_ml_env):
    injury_result = await train_and_register_injury_model()
    performance_result = await train_and_register_performance_models()

    assert injury_result["rows"] > 0
    assert "auc_roc" in injury_result["metrics"]
    assert performance_result["registered_models"]

    registry = ModelRegistry()
    models = await registry.list_models()
    assert models


async def test_model_registry_registers_and_loads_correctly(seeded_ml_env):
    registry = ModelRegistry()
    record = await registry.register("dummy_model", "v1", {"value": 42}, {"accuracy": 0.91})
    assert record.name == "dummy_model"

    loaded = await registry.load("dummy_model")
    listed = await registry.list_models()

    assert loaded == {"value": 42}
    assert any(item["name"] == "dummy_model" and item["version"] == "v1" for item in listed)


def test_injury_ml_predictor_falls_back_gracefully_when_no_model_exists():
    from app.injury.ml.predictor import InjuryMLPredictor

    predictor = InjuryMLPredictor()
    score = predictor.predict({"_fallback_score": 0.42, "acwr_7d": 1.4})
    assert score == 0.42


async def test_shap_explanation_endpoint_returns_valid_factor_list(seeded_ml_env):
    async with database.AsyncSessionLocal() as session:
        dataset = await build_injury_training_dataset(session)
        if not dataset.empty and dataset["target"].nunique() < 2:
            dataset.loc[dataset.index[0], "target"] = 0
            dataset.loc[dataset.index[-1], "target"] = 1
        trained = train_injury_classifier(dataset)
        await ModelRegistry().register("injury_risk", "test-shap", trained.model, {"auc_roc": 0.99})
        athlete_user = (await session.execute(select(User).where(User.role == UserRole.athlete))).scalars().first()
        assert athlete_user is not None
        athlete_id = athlete_user.athlete_id

    sys_admin = await _get_user_by_role(UserRole.sys_admin)
    headers = {"Authorization": f"Bearer {create_access_token(sys_admin)}"}
    response = await seeded_ml_env["client"].get(f"/api/v1/ml/injury/explain/{athlete_id}", headers=headers)
    assert response.status_code == 200
    factors = response.json()["data"]
    assert factors
    assert {"feature", "value", "shap_value", "direction"} <= set(factors[0].keys())


async def test_auc_guard_does_not_register_model_when_score_too_low(seeded_ml_env, monkeypatch):
    from app.ml.injury_model import InjuryTrainingResult, build_injury_pipeline
    import app.ml.train_injury as train_injury_module

    def fake_train(_dataset):
        return InjuryTrainingResult(
            model=build_injury_pipeline(use_smote=False),
            metrics={"auc_roc": 0.61, "precision": 0.1, "recall": 0.1, "f1": 0.1, "rows": 20},
            rows=20,
            accepted=False,
        )

    monkeypatch.setattr(train_injury_module, "train_injury_classifier", fake_train)
    result = await train_injury_module.train_and_register_injury_model()
    models = await ModelRegistry().list_models()

    assert result["registered"] is False
    assert not models
