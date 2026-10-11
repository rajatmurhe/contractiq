# ContractIQ — evidence-first supplier contract review

ContractIQ helps procurement reviewers find commercial risks, inspect exact source evidence, compare negotiated drafts, and record a human decision. The active product is a React/Vite frontend and Python/FastAPI API served together from one origin. No subscription, checkout, or credit card is required for evaluation.

## Try it

- **Free guest evaluation:** enter without an account, upload your own PDF/DOCX/TXT or paste a contract, and inspect the extracted text. With a host-configured model, analyze, ask questions, compare revisions, decide and export.
- **Curated walkthrough:** a separate sample entry offers synthetic agreements and prepared findings, including when no model key is configured. It does not pretend to analyze arbitrary text.
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

### Optional local model configuration

With Ollama running and `llama3.2:3b` already installed, run `make start-local`. The command creates a local model variant with a 16,384-token context, enables schema-constrained responses, and limits review input to 8,000 UTF-8 bytes to leave room for instructions and output. Set `REVIEW_LOCAL_MODEL` to use another installed instruction model with at least that context. This sends inference to localhost and requires no paid API key. Local responses may take up to three minutes. Model quality and latency depend on the model and hardware; citation validation still applies. **The installed 3B model failed validation on an independent synthetic review during verification; it is not enabled as the default or claimed ready. Use a stronger model and validate results before relying on this option.** This enables only the local app: a public deployment must have its own reachable inference service.

## What is implemented

| Workflow | Behavior |
| --- | --- |
| Import | PDF, DOCX, UTF-8 TXT, or pasted text; extraction preview before analysis; bounded parser worker |
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

Supported input is pasted text, searchable PDF, Word `.docx`, or UTF-8 `.txt` (5 MB, 60,000 extracted characters, at most 100 PDF pages). Extraction is transient and does not call AI. Scanned or locked PDFs are rejected; OCR, organization roles, SSO, billing, jurisdictional legal compliance, retention automation and SAP/Salesforce execution are not implemented in the active product. The audit checks local hash-chain consistency; it is not externally anchored.

The earlier .NET/Keycloak/LangGraph prototype remains under its original directories for reference. Its architecture and mock demo are [archived here](docs/legacy/prototype-architecture.md). They are not part of the current runtime, and their separate legacy CI failures are not hidden by the review workflow. Use `Review pilot` CI to assess the active product.
