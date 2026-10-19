"""Run the real ContractIQ contract Q&A route and score it with Ragas.

The checked-in dataset uses a synthetic agreement only. Live mode makes model
calls for both ContractIQ answers and the Ragas judge; it can consume quota.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "evals" / "ragas" / "contract_qa.json"


def load_dataset() -> dict[str, Any]:
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    cases = dataset.get("cases")
    if not isinstance(cases, list) or not 20 <= len(cases) <= 30:
        raise ValueError("The Ragas set must contain between 20 and 30 questions.")
    ids: set[str] = set()
    for case in cases:
        if not all(isinstance(case.get(key), str) and case[key].strip() for key in ("id", "question", "reference")):
            raise ValueError("Each case needs non-empty id, question, and reference fields.")
        if case["id"] in ids:
            raise ValueError(f"Duplicate case id: {case['id']}")
        ids.add(case["id"])
    if not isinstance(dataset.get("contract"), str) or len(dataset["contract"]) < 50:
        raise ValueError("A synthetic contract of at least 50 characters is required.")
    return dataset


def validate_retrieval(dataset: dict[str, Any]) -> dict[str, Any]:
    # Keep this check usable in ordinary CI without an LLM key.
    sys.path.insert(0, str(ROOT / "src" / "agent"))
    from app.review.assistant import retrieve

    review = {"id": "ragas-fixture", "title": "Synthetic MSA", "text": dataset["contract"]}
    empty: list[str] = []
    for case in dataset["cases"]:
        contexts = retrieve(case["question"], review)
        if not contexts:
            empty.append(case["id"])
    if empty:
        raise ValueError("No context retrieved for cases: " + ", ".join(empty))
    return {"question_count": len(dataset["cases"]), "retrieval_nonempty": len(dataset["cases"])}


def collect_live_examples(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """Call the actual /ask endpoint using isolated synthetic review records."""
    sys.path.insert(0, str(ROOT / "src" / "agent"))

    # The API reads this when its module is imported. Use an isolated temporary DB.
    temp_db = tempfile.TemporaryDirectory(prefix="contractiq-ragas-")
    os.environ["REVIEW_DB"] = str(Path(temp_db.name) / "eval.sqlite3")
    from fastapi.testclient import TestClient
    from app.review.api import app, database, new_session

    examples: list[dict[str, Any]] = []
    with TestClient(app) as client:
        for case in dataset["cases"]:
            review_id = str(uuid4())
            session = new_session("ragas:" + review_id, "Ragas synthetic evaluator", False)
            body = {
                "id": review_id,
                "title": "Synthetic Northstar / Meridian MSA",
                "text": dataset["contract"],
                "mode": "live",
                "model": os.getenv("REVIEW_LLM_MODEL", "configured-review-model"),
                "findings": [],
                "coverage": [],
                "comparison": None,
            }
            with database() as db:
                db.execute("INSERT INTO reviews VALUES (?,?,?)", (review_id, session["owner"], json.dumps(body)))

            # Capture the full ordered retrieval result passed to the answer generator.
            from app.review.assistant import retrieve

            contexts = retrieve(case["question"], body)
            response = client.post(
                f"/api/review/contracts/{review_id}/ask",
                headers={"Authorization": "Bearer " + session["token"]},
                json={"question": case["question"]},
            )
            if response.status_code != 200:
                raise RuntimeError(f"Case {case['id']} failed with HTTP {response.status_code}.")
            result = response.json()
            examples.append(
                {
                    "id": case["id"],
                    "user_input": case["question"],
                    "response": result["answer"],
                    "retrieved_contexts": [item["quote"] for item in contexts],
                    "reference": case["reference"],
                    "answer_status": result["status"],
                    "citation_count": len(result["sources"]),
                }
            )
    # TestClient has finished using the isolated database; remove it before writing output.
    temp_db.cleanup()
    return examples


async def score(examples: list[dict[str, Any]]) -> dict[str, Any]:
    from openai import AsyncOpenAI
    from ragas.llms import llm_factory
    from ragas.metrics.collections import ContextPrecision, Faithfulness

    api_key = os.getenv("RAGAS_EVAL_API_KEY") or os.getenv("REVIEW_LLM_API_KEY")
    if not api_key:
        raise ValueError("Set RAGAS_EVAL_API_KEY or REVIEW_LLM_API_KEY for live evaluation.")
    base_url = os.getenv("RAGAS_EVAL_BASE_URL") or os.getenv("REVIEW_LLM_BASE_URL")
    model = os.getenv("RAGAS_EVAL_MODEL") or os.getenv("REVIEW_LLM_MODEL")
    if not model:
        raise ValueError("Set RAGAS_EVAL_MODEL or REVIEW_LLM_MODEL for the judge model.")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    judge = llm_factory(model, client=client)
    faithfulness = Faithfulness(llm=judge)
    context_precision = ContextPrecision(llm=judge)
    rows: list[dict[str, Any]] = []
    try:
        # Sequential scoring keeps pressure on free-tier provider quotas predictable.
        for example in examples:
            sample = {
                "user_input": example["user_input"],
                "response": example["response"],
                "retrieved_contexts": example["retrieved_contexts"],
                "reference": example["reference"],
            }
            faithful = await faithfulness.ascore(
                user_input=sample["user_input"],
                response=sample["response"],
                retrieved_contexts=sample["retrieved_contexts"],
            )
            precise = await context_precision.ascore(
                user_input=sample["user_input"],
                reference=sample["reference"],
                retrieved_contexts=sample["retrieved_contexts"],
            )
            rows.append(
                {
                    "id": example["id"],
                    "faithfulness": float(faithful.value),
                    "context_precision": float(precise.value),
                    "answer_status": example["answer_status"],
                    "citation_count": example["citation_count"],
                }
            )
    finally:
        await client.close()

    faithful_scores = [row["faithfulness"] for row in rows]
    precision_scores = [row["context_precision"] for row in rows]
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "judge_model": model,
        "question_count": len(rows),
        "metrics": {
            "faithfulness": statistics.mean(faithful_scores),
            "context_precision": statistics.mean(precision_scores),
        },
        "per_case": rows,
        "limitations": [
            "Synthetic, author-written cases; no customer contracts were used.",
            "LLM-judge metrics are estimates, not legal accuracy or safety certification.",
            "Review and judge use the configured provider; scores can vary by model and run.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "evals" / "ragas" / "latest-report.json")
    parser.add_argument("--validate-only", action="store_true", help="Check dataset size and retrieval without model calls.")
    parser.add_argument("--min-faithfulness", type=float, default=0.75)
    parser.add_argument("--min-context-precision", type=float, default=0.75)
    args = parser.parse_args()

    dataset = load_dataset()
    validation = validate_retrieval(dataset)
    if args.validate_only:
        print(json.dumps(validation, indent=2))
        return 0
    try:
        examples = collect_live_examples(dataset)
        report = asyncio.run(score(examples))
    except Exception as exc:
        # Do not print provider errors, request bodies, credentials or contract payloads.
        print(f"Live Ragas evaluation failed ({type(exc).__name__}).", file=sys.stderr)
        return 2

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    metrics = report["metrics"]
    print(json.dumps({"question_count": report["question_count"], "metrics": metrics, "report": str(args.output)}, indent=2))
    if metrics["faithfulness"] < args.min_faithfulness or metrics["context_precision"] < args.min_context_precision:
        print("Ragas score is below the configured regression threshold.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
