# ContractIQ: evidence-first review pilot

The pilot replaces the default SPA with a focused procurement review experience. The previous dashboard components and .NET services remain in the repository, but are not mounted by the new SPA. **Do not merge and redeploy the existing frontend service alone**: the new frontend requires `/api/review/*` from the standalone FastAPI app. Deploy the new full-stack service first and switch the public URL after validation.

## Run locally

From the repository root, using Python 3.11+ and Node 22.12+:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-review.txt
npm --prefix src/frontend ci
npm --prefix src/frontend run build
PYTHONPATH=src/agent .venv/bin/uvicorn app.review.api:app --host 127.0.0.1 --port 8017
```

Open http://127.0.0.1:8017. Sample review works without accounts or model keys. The Vite development proxy targets port 8000; use that backend port for Vite development, or change the proxy when occupied.

## What is real, what is sample

| Capability | Implementation and limits |
| --- | --- |
| Sample review | Fixed synthetic agreement and five curated findings. Explicitly labeled; no model call. |
| Private review | Google ID-token verification on the server, opaque one-hour bearer session stored only in browser memory, hashed session tokens in SQLite. |
| Live analysis | Configured OpenAI-compatible chat provider returns schema-validated commercial findings and draft changes. Exact source quotation checks reject a whole response if any citation is fabricated. No invented offsets: the server computes them. |
| Evidence assistant | Retrieves up to three verified findings using lexical overlap, then answers from that evidence. Live answers are model-generated; sample answers are deterministic. Citation IDs are allow-listed. Not semantic search. |
| Landing assistant | Model-generated product Q&A when configured; clearly labeled guided answers otherwise. Global hourly model-call budget and per-client/session limits apply. |
| Human decision | All reviews wait for a human, even zero-finding results. Reason required, one final decision per review, atomic transaction. Approval does not sign anything or call an ERP. |
| Persistence | SQLite reviews survive restarts only with persistent storage; Google subject scopes access. No organization roles yet. Demo workspaces use isolated random identities and are not recoverable after sign-out. |
| Audit | Hash chain detects edits to individual events. It is not externally anchored, deletion-proof, or resistant to an administrator rewriting the chain. |
| Business model | Proposed per-workspace subscription pricing; billing and usage entitlements are not implemented. |

Input supports pasted text or UTF-8 `.txt`, up to 60,000 characters. PDF/DOCX extraction, OCR, jurisdiction-specific compliance, customer SSO, organization roles, retention controls and production incident handling are not implemented in this path. Existing microservice mocks are not evidence of these capabilities. Exact quotation proves provenance, not correct legal interpretation or full recall.

## Configure live AI and Google login

Set the variables in `.env.review.example` in the hosting environment. Local uvicorn does not automatically load that file; set the variables in the shell or use a process manager. Never put model keys in `VITE_` variables.

- `GOOGLE_CLIENT_ID`: Google OAuth web client with the exact app origin in Authorized JavaScript origins. The browser uses Google Identity Services; the server verifies audience/signature/expiry with `google-auth` and requires a verified email. [Google verification documentation](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- `REVIEW_LLM_API_KEY`: secret for the configured inference provider.
- `REVIEW_LLM_BASE_URL`: OpenAI-compatible base URL ending in `/v1` (default `https://api.openai.com/v1`). The service appends `/chat/completions`.
- `REVIEW_LLM_MODEL`: a model supporting JSON-object responses (default `gpt-4o-mini`). Validate compatibility with your provider before judging.
- `REVIEW_DB`: persistent SQLite path.
- `REVIEW_HOURLY_MODEL_LIMIT`: global live model-call limit, default 60. Per-user live reviews are also limited to 10/hour and chat to 20/hour. Requests count even when a provider fails.

Contract text and selected evidence are transmitted to the configured provider. Review that provider’s data policy before using real customer agreements. The public demo accepts only the supplied synthetic agreement.

## Render deployment

`Dockerfile.review` builds the SPA and serves it on the same origin as FastAPI. `render.review.yaml` describes a **new** service with a persistent disk. A disk may incur hosting charges; no service was created automatically. Existing `render.yaml` remains unchanged.

1. Create a Docker web service from the review branch, using the repository root as context and `Dockerfile.review`.
2. Mount persistent storage at `/data`; configure the environment variables above.
3. Use `/health/ready` as the health check. It verifies database access and reports whether live AI is configured; it does not make an inference call.
4. Add the new HTTPS origin to the Google OAuth client.
5. Confirm sample flow, real Google login, real model review, logout, re-login persistence and two-account isolation on the deployed service.
6. Only then replace the submission URL. Do not claim live AI merely because the sample works.

If trying a free ephemeral service, explicitly treat all stored reviews as disposable and do not use real contracts. For a production rollout, add a managed database, backups, deletion/retention workflows, operational monitoring, request-body limits at the edge and external audit anchoring. IP rate limits depend on correctly configured trusted proxy handling; they are abuse friction, not a complete perimeter.

## Validation

```sh
.venv/bin/pip install pytest pytest-asyncio
PYTHONPATH=src/agent .venv/bin/pytest src/agent/tests/test_review_api.py -q
npm --prefix src/frontend run type-check
npm --prefix src/frontend run build
```

The suite checks exact evidence, fabricated citations, demo restrictions, cross-user access for read/chat/audit/decision, atomic decision locking, audit tamper detection, token revocation, rejected Google verification, stable identity persistence and provider failure. Google and model integrations are mocked in tests; these checks do not establish live provider correctness.

## Three-minute judging walkthrough

- **0:00–0:25 — Customer problem.** “Procurement needs to know what to negotiate before a supplier agreement is signed. A generic summary does not show whether a finding is grounded.”
- **0:25–1:15 — Evidence.** Open the synthetic Meridian sample. Select unlimited liability and show the highlighted source. Select renewal and explain that the 90-day cancellation cutoff exceeds this customer’s 60-day maximum preference. Show draft negotiation language.
- **1:15–1:45 — Meaningful AI.** With live credentials configured, sign in and submit a different agreement. Explain schema validation, computed offsets, rejection of fabricated quotes, and evidence retrieval for follow-up questions. Do not present sample findings as generated output.
- **1:45–2:20 — Human control.** Request changes with a reason. Show the persistent decision and verified audit chain. Explain that the application does not sign the document or silently write to external tools.
- **2:20–3:00 — Business.** Initial buyer: procurement leads at growing software companies. Proposed Starter $49/50 reviews and Team $199/300 reviews. Validate willingness to pay and actual review cost during pilots; no measured ROI or customer traction is claimed.

The strongest next differentiator is a small labeled evaluation corpus that measures citation accuracy, risk recall and unsupported-answer rate across adversarial contracts. Automated plumbing tests are not model-quality evaluation.

## Additional validation

The review module passes Ruff and strict mypy checks. Frontend lint, type checking, build and five user-flow tests pass (the three older placeholder tests are still present). The five new tests cover Unicode source highlighting, reason-gated decisions, API rejection, evidence citations and logout. npm audit reported zero known vulnerabilities after upgrading the build/test stack. UI coverage is approximately 52% of lines; Google popup and real inference are not covered by these tests.

The repository-wide legacy CI is still separate from this pilot’s focused checks. Its evaluation job references the absent `app.eval.runner`; legacy Python lint and .NET service validation require additional work. Do not report the entire repository as green based on the pilot workflow.

The deployment image was built and smoke-tested locally: frontend serving, readiness, sample review, human decision, isolation and a saved review surviving full container recreation using a named persistent volume all passed. Temporary test containers and volumes were removed afterward.
