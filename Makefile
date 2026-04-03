dev:
	docker compose up --build

test:
	pytest tests/ -v --cov=app

seed:
	docker compose --profile seed up seed

migrate:
	alembic upgrade head

lint:
	ruff check app/ && black --check app/

format:
	black app/ && ruff check app/ --fix

logs:
	docker compose logs -f api worker

shell:
	docker compose exec api bash
