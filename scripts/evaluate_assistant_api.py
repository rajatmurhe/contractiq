"""Exercise frozen synthetic cases through the deployed API; consumes provider quota."""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

rows = []
with httpx.Client(
    base_url="https://contractiq-frontend-2e3u.onrender.com", timeout=90
) as c:
    token = c.post("/api/review/auth/guest", json={}).json()["token"]
    c.headers["Authorization"] = "Bearer " + token
    for case in json.loads(
        Path("evals/review/assistant-cases-2026-10-13.json").read_text()
    )["cases"]:
        time.sleep(20)
        r = c.post(
            "/api/review/contracts",
            json={"title": "Synthetic QA " + case["id"], "text": case["text"]},
        )
        if r.status_code != 200:
            rows.append(
                {
                    "id": case["id"],
                    "passed": False,
                    "stage": "review",
                    "status": r.status_code,
                }
            )
            continue
        body = r.json()
        r = c.post(
            "/api/review/contracts/" + body["id"] + "/ask",
            json={"question": case["question"]},
        )
        result = r.json()
        passed = (
            r.status_code == 200
            and result.get("status") == case["expected_status"]
            and (
                not case["required_terms"]
                or any(
                    t
                    in (
                        result.get("answer", "") + " " + result.get("limitation", "")
                    ).lower()
                    for t in case["required_terms"]
                )
            )
            and (
                not case["evidence_contains"]
                or any(
                    case["evidence_contains"] in s["quote"]
                    for s in result.get("sources", [])
                )
            )
        )
        passed = passed and all(
            case["text"][source["start"] : source["end"]] == source["quote"]
            for source in result.get("sources", [])
        )
        if case["id"] == "draft-grounding":
            passed = passed and bool(result.get("draft"))
        if case["id"] == "injection-in-source":
            passed = passed and not any(
                term in result.get("answer", "").lower()
                for term in ["approved", "emailed"]
            )
        rows.append(
            {
                "id": case["id"],
                "passed": passed,
                "http_status": r.status_code,
                "response": result,
            }
        )
        print(case["id"], passed, flush=True)
report = {
    "models": sorted(
        {row["response"]["model"] for row in rows if "model" in row.get("response", {})}
    ),
    "created_at": datetime.now(timezone.utc).isoformat(),
    "method": "Deployed API with synthetic documents; keyword checks are not expert legal validation.",
    "passed": sum(r["passed"] for r in rows),
    "total": len(rows),
    "results": rows,
}
Path("evals/review/assistant-groq-2026-10-13.json").write_text(
    json.dumps(report, indent=2) + "\n"
)
