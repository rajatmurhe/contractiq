# Contract Q&A quality evaluation

This benchmark runs 24 synthetic questions through ContractIQ's real `/ask` route and scores the resulting answers and retrieved passages with Ragas **Faithfulness** and **Context Precision**. The agreement and questions are author-written. They are not customer data, legal advice, or practitioner-validated examples.

Faithfulness estimates whether answer claims are supported by the passages supplied to the assistant. Context Precision estimates whether relevant passages appear near the top of the retrieved list, compared with the reference answer. Neither metric measures legal correctness, completeness across arbitrary contracts, or user value. LLM-judge scores can vary by judge model and run.

## Run locally

The no-key validation confirms that the 24 questions have references and retrieve at least one passage:

```sh
pip install -r requirements-review.txt
PYTHONPATH=src/agent python scripts/evaluate_contract_qa_ragas.py --validate-only
```

Live evaluation requires an OpenAI-compatible review provider. It makes 24 ContractIQ answer calls plus sequential Ragas judge calls (the number varies with retrieved passages and metric internals), so it can consume provider quota. Keep the input agreement synthetic; do not place customer contracts in this dataset or workflow artifact.

```sh
pip install -r requirements-review.txt -r requirements-ragas.txt
export REVIEW_LLM_API_KEY='your-provider-key'
export REVIEW_LLM_BASE_URL='https://api.groq.com/openai/v1'
export REVIEW_LLM_MODEL='openai/gpt-oss-120b'
export RAGAS_EVAL_MODEL="$REVIEW_LLM_MODEL"
PYTHONPATH=src/agent python scripts/evaluate_contract_qa_ragas.py --output /tmp/ragas-report.json
```

The initial CI regression thresholds are 0.75 for each metric. These are provisional guardrails for this small synthetic set, not industry benchmarks. Review per-question failures and agree on thresholds after practitioner review.

## CI

The GitHub Actions workflow validates question count and retrieval coverage on relevant pushes and pull requests without calling a model. Start the **Contract Q&A Ragas evaluation** workflow manually in Actions to run the live scores. Add `REVIEW_LLM_API_KEY` as a repository Actions secret, then add repository variables `REVIEW_LLM_BASE_URL`, `REVIEW_LLM_MODEL`, and optionally `RAGAS_EVAL_MODEL`. The Ragas judge uses the same provider key and defaults to the review model.

The workflow saves `ragas-report.json` as an Actions artifact. The report contains only scores, question IDs, status and citation counts; it excludes the contract, answers, passages and credentials.
