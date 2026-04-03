from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core import database
from app.ml.base import ModelRegistry
from app.ml.injury_model import build_injury_training_dataset, train_injury_classifier


async def train_and_register_injury_model() -> dict:
    async with database.AsyncSessionLocal() as session:
        dataset = await build_injury_training_dataset(session)
    result = train_injury_classifier(dataset)
    response = {
        "registered": False,
        "model_name": "injury_risk",
        "version": None,
        "metrics": result.metrics,
        "rows": result.rows,
    }
    if result.accepted:
        registry = ModelRegistry()
        version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        await registry.register("injury_risk", version, result.model, result.metrics)
        response["registered"] = True
        response["version"] = version
    return response


async def main() -> None:
    result = await train_and_register_injury_model()
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
