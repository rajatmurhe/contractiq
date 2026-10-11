# ContractIQ commercial-review evaluation

Twenty synthetic, author-labeled agreements exercise P1–P5. They are not real customer contracts or independently expert-reviewed legal annotations. Most cases share a template; passing is an initial regression signal, not evidence of generalization to arbitrary agreements. Keep separate, unseen practitioner examples for the final demonstration.

## Reproduce

From the repository root:

```sh
# No network/model calls. Checks annotation/source consistency only.
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate --output evals/review/corpus-validation.json

# Twenty provider calls. Requires the configured provider and consumes its credits.
PYTHONPATH=src/agent .venv/bin/python -m app.review.evaluate --live --output evals/review/live-report.json
```

Set `REVIEW_LLM_API_KEY`, `REVIEW_LLM_BASE_URL`, and `REVIEW_LLM_MODEL` in the process environment. Set current provider prices in `REVIEW_INPUT_PRICE_PER_MILLION` and `REVIEW_OUTPUT_PRICE_PER_MILLION` for cost estimates. A missing price or missing usage yields unknown cost, never zero. Estimates do not include hosting, retries, human review, cached-token discounts or provider-specific fees. Do not put secrets in a report or commit them.

The CLI runs outside the API's hourly throttle and makes one request per case, sequentially. The checked-in corpus-validation report has **no AI quality metrics**. No live benchmark has been run yet.

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
