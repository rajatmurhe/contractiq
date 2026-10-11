.DEFAULT_GOAL := help

ROOT_DIR := $(shell pwd)
COMPOSE := docker compose -f infra/docker/compose.yml
COMPOSE_OBS := $(COMPOSE) -f infra/docker/compose.observability.yml

##@ Help
.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development
.PHONY: up down up-obs
up: ## Start core stack (no observability)
	$(COMPOSE) up -d --wait
	@echo "✅ Stack is up. Frontend: http://localhost:3000 | Gateway: http://localhost:5000"

up-obs: ## Start stack with observability (Jaeger + Prometheus + Grafana)
	$(COMPOSE_OBS) up -d --wait
	@echo "✅ Observability stack: Jaeger http://localhost:16686 | Grafana http://localhost:3100"

down: ## Stop all services
	$(COMPOSE_OBS) down --remove-orphans

##@ Build
.PHONY: build build-dotnet build-python build-frontend
build: build-dotnet build-python build-frontend ## Build all stacks

build-dotnet: ## Build .NET solution
	dotnet build src/backend/ContractIQ.sln --configuration Release --no-restore

build-python: ## Build Python services (install deps in venv)
	cd src/agent && uv pip install -e ".[dev]" --python 3.12
	cd src/mcp-server && uv pip install -e ".[dev]" --python 3.12

build-frontend: ## Build React frontend
	cd src/frontend && npm ci && npm run build

##@ Testing
.PHONY: test test-dotnet test-python test-frontend test-e2e test-security test-contract
test: test-dotnet test-python test-frontend ## Run all unit + integration tests

test-dotnet: ## Run .NET xUnit tests with Testcontainers
	dotnet test src/backend/ContractIQ.sln \
		--configuration Release \
		--collect:"XPlat Code Coverage" \
		--results-directory TestResults \
		--logger "trx;LogFileName=results.trx" \
		-- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura

test-python: ## Run Python pytest suite
	cd src/agent && uv run pytest tests/ -v --cov=app --cov-report=xml --cov-report=term-missing

test-frontend: ## Run Vitest unit tests
	cd src/frontend && npm run test:unit -- --coverage

test-e2e: up ## Run Playwright E2E tests (requires stack running)
	cd tests/e2e && npm ci && npx playwright test

test-contract: ## Run Pact consumer + provider contract tests
	cd tests/contract && npm ci && npm test

test-security: ## Run cross-tenant leak tests + injection suite
	cd tests/security && uv run pytest -v

test-k6: up ## Run k6 performance scenarios
	k6 run tests/k6/golden-path.js --out json=docs/k6-report.json
	@echo "📊 Report written to docs/k6-report.json"

##@ Evaluation
.PHONY: eval eval-baseline
eval: ## Run agent eval suite → docs/eval-report.md
	cd src/agent && uv run python -m app.eval.runner \
		--dataset tests/eval/extraction_eval.jsonl \
		--adversarial tests/eval/adversarial_corpus.jsonl \
		--output ../../docs/eval-report.md
	@echo "📋 Eval report: docs/eval-report.md"

eval-baseline: ## Save current eval results as the CI baseline
	cd src/agent && uv run python -m app.eval.runner \
		--dataset tests/eval/extraction_eval.jsonl \
		--save-baseline tests/eval/baseline.json
	@echo "✅ Baseline saved to tests/eval/baseline.json"

##@ Database
.PHONY: migrate migrate-verify seed
migrate: ## Apply EF Core migrations for all services
	dotnet ef database update --project src/backend/Contracts/ContractIQ.Contracts.Infrastructure --startup-project src/backend/Contracts/ContractIQ.Contracts.Api
	dotnet ef database update --project src/backend/Workflow/ContractIQ.Workflow.Infrastructure --startup-project src/backend/Workflow/ContractIQ.Workflow.Api
	dotnet ef database update --project src/backend/Audit/ContractIQ.Audit.Infrastructure --startup-project src/backend/Audit/ContractIQ.Audit.Api
	dotnet ef database update --project src/backend/Tenants/ContractIQ.Tenants.Infrastructure --startup-project src/backend/Tenants/ContractIQ.Tenants.Api
	dotnet ef database update --project src/backend/Integrations/ContractIQ.Integrations.Infrastructure --startup-project src/backend/Integrations/ContractIQ.Integrations.Api

migrate-verify: ## Verify no pending migrations
	@for proj in Contracts Workflow Audit Tenants Integrations; do \
		echo "Checking $$proj..."; \
		dotnet ef migrations has-pending-model-changes \
			--project src/backend/$$proj/ContractIQ.$$proj.Infrastructure \
			--startup-project src/backend/$$proj/ContractIQ.$$proj.Api || exit 1; \
	done

seed: up migrate ## Seed database with 3 tenants + 40+ contracts
	bash scripts/seed.sh
	@echo "✅ Seed complete. 3 tenants, 40+ contracts loaded."

##@ Demo
.PHONY: demo demo-reset
demo: up seed ## Run scripted golden-path demo
	@echo "🎬 Starting ContractIQ demo..."
	bash scripts/demo.sh
	@echo "✅ Demo complete. See docs/demo-script.md for narration."

demo-reset: ## Reset demo state (wipe + re-seed)
	$(COMPOSE) down -v
	$(MAKE) demo

##@ Code Quality
.PHONY: lint lint-dotnet lint-python lint-frontend fmt
lint: lint-dotnet lint-python lint-frontend ## Run all linters

lint-dotnet: ## .NET format check + analyzers
	dotnet format src/backend/ContractIQ.sln --verify-no-changes

lint-python: ## Ruff + mypy
	cd src/agent && uv run ruff check app/ tests/
	cd src/agent && uv run mypy app/ --strict
	cd src/mcp-server && uv run ruff check app/
	cd src/mcp-server && uv run mypy app/ --strict

lint-frontend: ## ESLint + TypeScript check
	cd src/frontend && npm run lint && npm run type-check

fmt: ## Auto-format all code
	dotnet format src/backend/ContractIQ.sln
	cd src/agent && uv run ruff format app/ tests/
	cd src/mcp-server && uv run ruff format app/
	cd src/frontend && npm run format

##@ Security
.PHONY: scan scan-images sbom
scan: ## Run dependency vulnerability scans
	dotnet list src/backend/ContractIQ.sln package --vulnerable --include-transitive
	cd src/agent && uv run pip-audit
	cd src/frontend && npm audit --audit-level=high

scan-images: ## Scan Docker images with Trivy
	trivy image contractiq/contracts-api:latest
	trivy image contractiq/agent-service:latest

sbom: ## Generate Software Bill of Materials
	syft dir:. -o spdx-json > docs/sbom.json
	@echo "✅ SBOM written to docs/sbom.json"

##@ Observability Evidence
.PHONY: trace-screenshot
trace-screenshot: ## Capture end-to-end trace screenshot from Jaeger
	mkdir -p docs/evidence
	curl -s "http://localhost:16686/api/traces?service=contractiq&limit=1" | \
		python3 scripts/capture_trace.py > docs/evidence/otel-trace.json
	@echo "📸 Trace saved to docs/evidence/otel-trace.json"

##@ CI Utilities
.PHONY: ci-check
ci-check: lint test eval ## Full CI check (lint + test + eval)
	@echo "✅ All CI checks passed."
