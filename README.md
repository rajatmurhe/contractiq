# ContractIQ — evidence-first supplier contract review

ContractIQ helps procurement reviewers find commercial risks, inspect exact source evidence, compare negotiated drafts, and record a human decision. The active product is a React/Vite frontend and Python/FastAPI API served together from one origin. No subscription, checkout, or credit card is required for evaluation.

## Try it

- **Free guest evaluation:** with a host-configured model, enter without an account, paste your own agreement or use the prefilled sample, then analyze, ask questions, compare revisions, decide and export.
- **Curated walkthrough:** without a model key, the app explicitly offers synthetic agreements and prepared findings. It does not pretend to analyze arbitrary text.
- **Google sign-in:** optional for stable identity and returning to persisted reviews. Guest sessions last one hour, survive refresh in the same tab, and cannot be recovered after sign-out or closing the tab.

The host funds model usage. Guest session creation, review/chat calls and global hourly model calls are bounded. Future pricing on the landing page is a business-model proposal, not a feature gate.

## Run the complete app

Python 3.11+ and Node 22.12+ are required for a source run:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-review.txt
npm --prefix src/frontend ci
npm --prefix src/frontend run build
./scripts/start-review.sh
```

The root `Makefile` also provides `make setup`, `make build`, `make start`, `make test`, `make eval`, and `make demo` for this application.

Open http://127.0.0.1:8017. No model credentials are needed for the curated walkthrough. To enable real guest reviews, set `REVIEW_LLM_API_KEY`, `REVIEW_LLM_BASE_URL`, and `REVIEW_LLM_MODEL` in the server environment. See [.env.review.example](.env.review.example) for variable names. Never put secrets in frontend `VITE_` variables. The source-run script uses exported environment variables, not automatic `.env` loading.

Docker runs the same app with a persistent local volume:

```sh
# Optional: copy .env.review.example to .env and configure values privately.
docker compose up --build
```

Docker Compose reads its environment from `.env` or exported variables. Source runs do not automatically read `.env`. Default UI/API port is 8017. `docker compose down` stops the service without deleting its named volume; `down -v` deletes stored review data.

## What is implemented

| Workflow | Behavior |
| --- | --- |
| Review | Five explicit procurement preferences: liability, indemnity, renewal, termination, data handling |
| Evidence | Schema-validated findings, exact source matching, server-computed Unicode offsets; fabricated citations reject the result |
| Questions | Retrieval over the current review's findings and allow-listed citation IDs; clear insufficient-evidence responses |
| Revision comparison | New review linked to owned baseline; exact text changes and rule-level risk changes; independent decision per version |
| Decision | Required rationale, atomic final decision, no automatic signing or external actions |
| Export | Authenticated JSON bundle with complete source, findings, comparison, playbook, decision and audit snapshot |
| Access | Isolated expiring guest/demo sessions, verified Google identity option, session revocation |
| Measurement | Review latency, provider token usage and optional cost estimates; synthetic evaluation runner |

An exact quotation proves provenance, not correct interpretation. No-longer-flagged findings do not prove that a risk is resolved. Every result requires a human decision.

## Verify

```sh
.venv/bin/pip install pytest pytest-asyncio ruff mypy
PYTHONPATH=src/agent .venv/bin/pytest src/agent/tests/test_review*.py -q
npm --prefix src/frontend run test:unit
./scripts/demo.sh
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate
```

`demo.sh` checks the running service; it fails if the API fails. It never prints fabricated workflow success. The evaluation command above validates the corpus only. Add `--live` to run actual billable model inference against the 20 synthetic cases. Read [metric definitions and limitations](evals/review/README.md).

## Deploy and submit

- New full-stack deployment: [render.review.yaml](render.review.yaml) and [Dockerfile.review](Dockerfile.review). Persistent hosting may cost money; the recruiter still pays nothing to evaluate.
- Existing Render blueprint: [render.yaml](render.yaml) migrates the existing frontend to the same-origin app. It retains legacy resources to avoid implicit deletion; they are not dependencies of the active product. Its free service uses ephemeral storage unless you explicitly configure persistence.
- [Configuration and deployment guide](docs/review-pilot.md)
- [October 15 release checklist](docs/judging/october-15-release.md)
- [Three-minute demonstration](docs/judging/demo-script.md)
- [Practitioner validation protocol](docs/judging/practitioner-validation.md)

Live provider and Google verification, public deployment and practitioner validation require actual credentials/accounts/participants. Do not claim completion from a sample run. No real customer ROI or live model benchmark is currently claimed.

## Scope and legacy code

Supported input is pasted text or UTF-8 `.txt`. PDF/OCR, organization roles, SSO, billing, jurisdictional legal compliance, retention automation and SAP/Salesforce execution are not implemented in the active product. The audit checks local hash-chain consistency; it is not externally anchored.

The earlier .NET/Keycloak/LangGraph prototype remains under its original directories for reference. Its architecture and mock demo are [archived here](docs/legacy/prototype-architecture.md). They are not part of the current runtime, and their separate legacy CI failures are not hidden by the review workflow. Use `Review pilot` CI to assess the active product.
