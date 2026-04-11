.PHONY: dev build down migrate makemigrations test lint frontend

# Backend
dev:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose exec backend alembic upgrade head

makemigrations:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

test:
	cd backend && pytest

lint:
	cd backend && ruff check . && black --check .

# Frontend
frontend:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build
