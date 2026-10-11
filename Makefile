.DEFAULT_GOAL := help
PYTHON := .venv/bin/python
COMPOSE := docker compose

.PHONY: help setup build start up down logs test test-python test-frontend lint eval eval-live demo ci-check legacy-help
help:
	@echo 'ContractIQ active review application'
	@echo 'make setup      Create Python environment and install dependencies'
	@echo 'make build      Build the frontend served by FastAPI'
	@echo 'make start      Run source app at http://127.0.0.1:8017'
	@echo 'make up/down    Start/stop the persistent local Docker app'
	@echo 'make test/lint  Verify the active review product'
	@echo 'make eval       Validate synthetic corpus without model calls'
	@echo 'make eval-live  Run billable inference benchmark with configured provider'
	@echo 'make demo       Smoke-test a running app; no fabricated successes'
	@echo 'make legacy-help  Inspect the archived prototype commands'
setup:
	python3 -m venv .venv
	$(PYTHON) -m pip install -r requirements-review.txt pytest pytest-asyncio ruff mypy
	npm --prefix src/frontend ci
build:
	npm --prefix src/frontend run build
start:
	./scripts/start-review.sh
up:
	$(COMPOSE) up --build -d --wait
down:
	$(COMPOSE) down
logs:
	$(COMPOSE) logs --tail 100 review
test: test-python test-frontend
test-python:
	PYTHONPATH=src/agent $(PYTHON) -m pytest src/agent/tests/test_review*.py -q
test-frontend:
	npm --prefix src/frontend run test:unit
lint:
	.venv/bin/ruff check src/agent/app/review
	.venv/bin/mypy src/agent/app/review --strict --ignore-missing-imports
	npm --prefix src/frontend run lint
	npm --prefix src/frontend run type-check
eval:
	PYTHONPATH=src/agent $(PYTHON) -m app.review.evaluate --output /tmp/contractiq-corpus-validation.json
eval-live:
	PYTHONPATH=src/agent $(PYTHON) -m app.review.evaluate --live --output evals/review/live-report.json
demo:
	./scripts/demo.sh
ci-check: lint test eval build
legacy-help:
	$(MAKE) -f docs/legacy/Makefile help
