"""Reproducible live evaluation. Offline validation never claims model accuracy."""

import argparse
import asyncio
import hashlib
import json
import math
import os
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .engine import review


def validate_corpus(corpus: dict[str, Any]) -> None:
    if not corpus.get("cases"):
        raise ValueError("Evaluation requires at least one case")
    ids: set[str] = set()
    for case in corpus["cases"]:
        if case["id"] in ids:
            raise ValueError("Duplicate case identifier")
        ids.add(case["id"])
        for rule, quote in case["expected_evidence"].items():
            if rule not in {"P1", "P2", "P3", "P4", "P5"} or quote not in case["source"]:
                raise ValueError(f"Invalid annotation in {case['id']}")
        if set(case["expected_evidence"]) & set(case["expected_missing_topics"]):
            raise ValueError("A missing topic cannot also have evidence")


def score_case(case: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    expected = case["expected_evidence"]
    matched: set[str] = set()
    unsupported = 0
    exact = 0
    for finding in result["findings"]:
        quote = finding["quote"]
        start, end = finding["start"], finding["end"]
        is_exact = case["source"][start:end] == quote
        exact += int(is_exact)
        rule = finding["rule"]
        anchor = expected.get(rule)
        # Gold is the whole relevant clause; a model may cite a shorter exact span.
        if is_exact and anchor and (anchor in quote or quote in anchor):
            matched.add(rule)
        else:
            unsupported += 1
    returned_missing = set(result.get("missing_topics", []))
    gold_missing = set(case["expected_missing_topics"])
    return {
        "true_positive_rules": len(matched),
        "missed_rules": sorted(set(expected) - matched),
        "unsupported_findings": unsupported,
        "exact_citations": exact,
        "returned_citations": len(result["findings"]),
        "missing_topics_correct": returned_missing == gold_missing,
    }


async def evaluate(corpus: dict[str, Any], output: Path, live: bool) -> dict[str, Any]:
    validate_corpus(corpus)
    report: dict[str, Any] = {
        "schema_version": 1,
        "created_at": datetime.now(UTC).isoformat(),
        "corpus_sha256": hashlib.sha256(json.dumps(corpus, sort_keys=True).encode()).hexdigest(),
        "mode": "live" if live else "corpus_validation_only",
        "model": os.getenv("REVIEW_LLM_MODEL", "gpt-4o-mini") if live else None,
        "case_count": len(corpus["cases"]),
        "limitations": [
            "Synthetic, author-labeled corpus; no independent expert validation.",
            "Recall is measured per playbook rule, not every possible legal issue.",
            "Exact quotations verify provenance, not interpretation or completeness.",
            "Provider failures count as missed expected rules; they are not discarded.",
        ],
        "results": [],
    }
    if live and not os.getenv("REVIEW_LLM_API_KEY"):
        raise ValueError("Set REVIEW_LLM_API_KEY before a live evaluation.")
    for case in corpus["cases"] if live else []:
        started = time.monotonic()
        try:
            result = await review(case["source"], False)
            row = {
                "id": case["id"],
                "status": "ok",
                **score_case(case, result),
                "usage": result.get("usage"),
                "findings": result["findings"],
            }
        except Exception as exc:
            # Do not publish provider exception messages, URLs, or credentials.
            row = {
                "id": case["id"],
                "status": "error",
                "error_type": type(exc).__name__,
                "true_positive_rules": 0,
                "missed_rules": list(case["expected_evidence"]),
                "unsupported_findings": 0,
                "exact_citations": 0,
                "returned_citations": 0,
                "missing_topics_correct": False,
                "usage": None,
            }
        row["elapsed_ms"] = round((time.monotonic() - started) * 1000)
        report["results"].append(row)
    if live:
        rows = report["results"]
        tp = sum(r["true_positive_rules"] for r in rows)
        fp = sum(r["unsupported_findings"] for r in rows)
        expected = sum(len(c["expected_evidence"]) for c in corpus["cases"])
        citations = sum(r["returned_citations"] for r in rows)
        latencies = sorted(r["elapsed_ms"] for r in rows)
        costs = [r["usage"].get("estimated_cost_usd") if r["usage"] else None for r in rows]
        report["metrics"] = {
            "rule_recall": tp / expected if expected else None,
            "rule_precision": tp / (tp + fp) if tp + fp else None,
            "missed_rule_count": expected - tp,
            "unsupported_finding_count": fp,
            "accepted_citation_exactness": sum(r["exact_citations"] for r in rows) / citations
            if citations
            else None,
            "successful_cases": sum(r["status"] == "ok" for r in rows),
            "failed_cases": sum(r["status"] != "ok" for r in rows),
            "missing_topic_exact_match": sum(r["missing_topics_correct"] for r in rows) / len(rows),
            "p50_latency_ms": latencies[(len(latencies) - 1) // 2],
            "p95_latency_ms": latencies[math.ceil(len(latencies) * 0.95) - 1],
            "estimated_total_cost_usd": sum(costs) if all(c is not None for c in costs) else None,
            "cost_note": (
                "Estimate requires configured prices and usage for every call; "
                "null means unknown, not free."
            ),
        }
    else:
        report["metrics"] = None
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, default=Path("evals/review/cases.json"))
    parser.add_argument("--output", type=Path, default=Path("evals/review/report.json"))
    parser.add_argument(
        "--live", action="store_true", help="Make billable provider calls for each synthetic case"
    )
    args = parser.parse_args()
    report = asyncio.run(evaluate(json.loads(args.cases.read_text()), args.output, args.live))
    print(json.dumps({k: report[k] for k in ("mode", "case_count", "metrics")}, indent=2))
    if args.live and report["metrics"]["failed_cases"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
