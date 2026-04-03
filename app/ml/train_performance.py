from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core import database
from app.ml.base import ModelRegistry
from app.ml.performance_model import build_performance_training_dataset, train_per_sport_model


async def train_and_register_performance_models() -> dict:
    async with database.AsyncSessionLocal() as session:
        dataset = await build_performance_training_dataset(session)
    if dataset.empty:
        return {"registered_models": []}

    registry = ModelRegistry()
    results: list[dict] = []
    for sport_name in sorted(dataset["sport"].unique()):
        training_result = train_per_sport_model(dataset, sport_name)
        if training_result is None:
            continue
        version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        model_name = f"performance_forecast_{sport_name.lower().replace(' ', '_')}"
        await registry.register(model_name, version, training_result.model, training_result.metrics)
        results.append({"name": model_name, "version": version, "metrics": training_result.metrics})
    return {"registered_models": results}


async def main() -> None:
    result = await train_and_register_performance_models()
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
