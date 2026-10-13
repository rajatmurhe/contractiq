# contractIQ commercial-review evaluation

Twenty synthetic, author-labeled agreements exercise P1–P5. They are not real customer contracts or independently expert-reviewed legal annotations. Most cases share a template; passing is an initial regression signal, not evidence of generalization to arbitrary agreements. Keep separate, unseen practitioner examples for the final demonstration.

## Reproduce

From the repository root:

```sh
# No network/model calls. Checks annotation/source consistency only.
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate --output evals/review/corpus-validation.json

# Up to forty provider calls, including bounded validation retries. Requires the configured provider and consumes its credits.
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate --live --output evals/review/live-report.json
```

Set `REVIEW_LLM_API_KEY`, `REVIEW_LLM_BASE_URL`, and `REVIEW_LLM_MODEL` in the process environment. Set current provider prices in `REVIEW_INPUT_PRICE_PER_MILLION` and `REVIEW_OUTPUT_PRICE_PER_MILLION` for cost estimates. A missing price or missing usage yields unknown cost, never zero. Estimates include reported usage from validation retries but do not include hosting, human review, cached-token discounts or provider-specific fees. Do not put secrets in a report or commit them.

The CLI runs outside the API's hourly throttle and allows up to two requests per case, sequentially. The checked-in corpus-validation report has **no AI quality metrics**. Live runs from October 11, 2026 are recorded below. These are development/regression results on this same author-labeled corpus, not a held-out quality estimate.

## Metric definitions

- Rule recall: correctly evidenced expected rules / all expected rules. Provider failures remain in the denominator.
- Rule precision: correctly evidenced expected rules / (those rules + unsupported returned findings). This is a rule-level proxy, not a clause-level legal accuracy score.
- Evidence matching: rule must match the label, quote must be an exact source span, and the predicted quote must contain or be contained within the annotated clause. Human assessment of rationale and proposed language is still required.
- Accepted citation exactness: exact spans among accepted results. Production rejects whole responses with fabricated quotes, so also inspect failed cases; this percentage alone is not model reliability.
- Missing-topic exact match: all returned missing P1–P5 identifiers must exactly match the expected set.
- Latency p50/p95: wall-clock review duration including validation; failed calls included.
- Cost: estimated token cost only when every call has usage and configured prices. Failed calls may still be billable, so a report containing unknown costs cannot assert a total.

Reports include model, timestamp, corpus SHA-256, per-case results and errors by type. Error messages and provider credentials are omitted. Do not tune on the final held-out cases and then call them unseen.

## Proposed pilot targets (not achieved results)

Before the final presentation, aim for at least 90% rule recall and precision, zero failed cases, and manually inspect every false positive/negative, missing-topic mismatch, and suggested revision. Include cost and latency measured on the actual deployed configuration. These are engineering targets for this narrow synthetic set, not a legal safety certification or guarantee. Human review remains mandatory even if targets are met.


## October 11 development runs

All runs use `openai/gpt-4o-mini` through OpenRouter on the same 20 synthetic cases. The first run exposed compliant clauses being flagged as risks. Two prompt revisions reduced false positives but did not consistently solve missing-topic and boundary-value errors. The final implementation requires a structured assessment of every playbook rule and validates evidence/status consistency before accepting findings.

- `baseline-2026-10-11.json`: original deployed review prompt; 95.24% recall, 36.36% precision, 18/20 successful calls, 90% missing-topic exact match.
- `regression-01-2026-10-11.json`: explicit deviation and numeric-threshold instructions; 95.24% recall, 100% precision, 19/20 successful calls, 85% missing-topic exact match.
- `regression-02-2026-10-11.json`: additional coverage and verbatim-quote instructions; 85.71% recall, 100% precision, 19/20 successful calls, 80% missing-topic exact match.

The source validator rejected altered quotations instead of accepting plausible-looking evidence. Earlier reports are retained rather than overwritten. Three additional diagnostic calls inspected the missing-topic and quote failures between the first two regression runs. None of these runs measures legal interpretation quality, suggested-language suitability, or independent practitioner value. Cost remains unknown because provider prices were not configured.


### Final structured-assessment regression

[`live-report.json`](live-report.json) was generated with the engine at commit `5458a51`: 20/20 successful cases, 100% rule recall, 91.30% rule precision, 100% missing-topic exact match, and 100% exact quotations among accepted findings. Median latency was 4.078 seconds; p95 was 6.635 seconds. These results meet the narrow recall/precision/completion targets above, but are **not held-out results** because failures in this corpus informed the implementation.

Two false positives remain: P3 on `termination-no-refund` (a compliant thirty-day renewal deadline) and P3 on `renewal-exact-boundary` (the allowed sixty-day boundary). The model's rationale incorrectly treats these values as exceeding sixty days. Their quotations are real, illustrating why source validation does not establish interpretation accuracy. Reviewers must check numeric thresholds and proposed changes. No missed expected rules or provider/validation failures occurred in this run; future calls can differ.


## October 12 customer-workflow QA

All inputs are synthetic. First-pass files are retained; after failures informed changes, reruns are explicitly development regressions. See [QA summary](../../docs/judging/qa-2026-10-12.md).

| Report | Cases completed | Rule recall | Rule precision | Missing-topic exact match |
| --- | ---: | ---: | ---: | ---: |
| [challenge-first-pass](challenge-first-pass-2026-10-12.json) | 8/8 | 80.0% | 66.7% | 87.5% |
| [challenge-regression](challenge-regression-2026-10-12.json) | 8/8 | 100.0% | 100.0% | 100.0% |
| [development-regression](development-regression-2026-10-12.json) | 19/20 | 100.0% | 72.4% | 95.0% |
| [holdout-first-pass](holdout-first-pass-2026-10-12.json) | 5/6 | 100.0% | 80.0% | 66.7% |
| [numeric-check-regression](numeric-check-regression-2026-10-12.json) | 20/20 | 100.0% | 100.0% | 100.0% |
| [holdout-regression](holdout-regression-2026-10-12.json) | 5/6 | 75.0% | 100.0% | 83.3% |
| [final-boundary-regression](final-boundary-regression-2026-10-12.json) | 5/6 | 100.0% | 100.0% | 83.3% |
| [source-match-regression](source-match-regression-2026-10-12.json) | 6/6 | 100.0% | 100.0% | 83.3% |

The last six-case regression completed all requests and matched all expected risk rules, but mislabeled coverage in `notice-without-refund` (five of six exact missing-topic sets). These metrics do not score the quality of explanations or replacement clauses. Manual inspection caught a numerically false explanation for a correctly flagged refund clause; the narrow explicit-refund check corrects that pattern. Other interpretations can still fail.

The engine now checks simple, unambiguous renewal/termination/deletion day thresholds after source validation, and abstains from arithmetic corrections on ambiguous expressions. A unique casing-only quotation match is restored to original source spelling; changed wording and ambiguous matches are rejected. At most one invalid-output retry is allowed and its usage counts toward the API budget. These checks do not discover all clauses or validate legal meaning.

To evaluate a deployed instance without copying provider secrets, use a synthetic corpus of at most ten cases:

```sh
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate --live --base-url https://YOUR-SERVICE --cases evals/review/challenge-2026-10-12.json --output /tmp/deployed-evaluation.json
```

This creates a guest session, consumes provider credits through the API, and retains synthetic review records. Read the source and labels before sending a corpus to a public service. Prices remain unconfigured in the recorded runs, so total cost is unknown.

## Groq dashboard assistant verification — 13 October 2026

The deployed API completed the 17-check live workflow. `assistant-groq-2026-10-13.json` records six synthetic assistant cases with exact source-offset checks, citation checks and explicit draft/injection checks. All six passed after correcting scoring to inspect both the answer and the limitation shown in the dashboard. The original 5/6 checker report is preserved separately; the conflict explanation was in limitation. This is rescoring of the same responses, not fresh independent evaluation.

Run `python scripts/evaluate_assistant_api.py` from the repository root to repeat the deployed synthetic cases; it consumes provider quota and spaces requests. Free plan limits can affect results. No API key is stored in the harness or reports. Keyword checks and a six-case set do not establish legal correctness, production reliability or ROI.
