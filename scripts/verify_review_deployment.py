"""Exercise a deployed review service using synthetic agreements only."""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import httpx


def run(
    base_url: str, live: bool, require_live_config: bool, guest_live: bool = False
) -> dict:
    origin = urlparse(base_url)
    if origin.username or origin.password or origin.query or origin.fragment:
        raise ValueError(
            "Use a plain service origin without credentials or query parameters."
        )
    if origin.scheme != "https" and not (
        origin.scheme == "http" and origin.hostname in {"127.0.0.1", "localhost", "::1"}
    ):
        raise ValueError("Remote deployment checks require HTTPS.")
    report = {
        "base_url": base_url,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "mode": "live" if live else "sample",
        "authentication": "guest" if guest_live else ("google" if live else "sample"),
        "checks": [],
        "limitations": [
            "This run does not verify backup recovery, Google browser popup, or practitioner value."
        ],
    }
    with httpx.Client(
        base_url=base_url.rstrip("/"), timeout=90, follow_redirects=False
    ) as client:

        def request(method, path, *, token=None, payload=None, expected=200):
            response = client.request(
                method,
                path,
                headers={"Authorization": "Bearer " + token} if token else {},
                json=payload,
            )
            if response.status_code != expected:
                raise RuntimeError(
                    f"{method} {path}: expected {expected}, received {response.status_code}"
                )
            return response.json() if expected == 200 else None

        def check(name, condition):
            if not condition:
                raise RuntimeError("Failed check: " + name)
            report["checks"].append(name)

        check("readiness", request("GET", "/health/ready")["status"] == "ready")
        config = request("GET", "/api/review/config")
        report["live_ai_configured"] = config["live_enabled"]
        report["google_configured"] = bool(config["google_client_id"])
        if require_live_config:
            check(
                "live configuration present",
                report["live_ai_configured"] and report["google_configured"],
            )
        if guest_live:
            login = request("POST", "/api/review/auth/guest", payload={})
        elif live:
            credential = os.getenv("REVIEW_SMOKE_GOOGLE_ID_TOKEN")
            if not credential:
                raise RuntimeError(
                    "Set REVIEW_SMOKE_GOOGLE_ID_TOKEN privately; never paste it in chat or commit it."
                )
            login = request(
                "POST", "/api/review/auth/google", payload={"credential": credential}
            )
        else:
            login = request("POST", "/api/review/auth/demo", payload={})
        token = login["token"]
        try:
            metadata = request("GET", "/api/review/auth/session", token=token)
            check(
                "session can be resumed",
                metadata["demo"] == (not live) and "token" not in metadata,
            )
            original = config["sample"]
            revised = config["revised_sample"]
            if live:
                fixture_dir = Path(__file__).resolve().parents[1] / "docs" / "judging"
                original = (fixture_dir / "demo-original.txt").read_text().strip()
                revised = (fixture_dir / "demo-revised.txt").read_text().strip()
                before_upload = request("GET", "/api/review/contracts", token=token)
                upload = client.post(
                    "/api/review/documents/extract?filename=synthetic-qa.txt",
                    headers={
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/octet-stream",
                    },
                    content=original.encode(),
                )
                check(
                    "upload extraction matches original",
                    upload.status_code == 200 and upload.json()["text"] == original,
                )
                check(
                    "extraction creates no review",
                    request("GET", "/api/review/contracts", token=token)
                    == before_upload,
                )
            baseline = request(
                "POST",
                "/api/review/contracts",
                token=token,
                payload={
                    "title": "Synthetic deployment verification",
                    "text": original,
                },
            )
            check(
                "correct inference mode",
                baseline["mode"] == ("live" if live else "sample"),
            )
            check("human decision required", baseline["status"] == "awaiting_review")
            check(
                "source citations valid",
                all(
                    baseline["text"][f["start"] : f["end"]] == f["quote"]
                    for f in baseline["findings"]
                ),
            )
            if live:
                answer = request(
                    "POST",
                    "/api/review/contracts/" + baseline["id"] + "/ask",
                    token=token,
                    payload={
                        "question": "Why is liability a risk and what change is suggested?"
                    },
                )
                check(
                    "live evidence answer has valid citations",
                    answer["mode"] == "live"
                    and bool(answer["citations"])
                    and set(answer["citations"])
                    <= {finding["id"] for finding in baseline["findings"]},
                )
            revision = request(
                "POST",
                "/api/review/contracts",
                token=token,
                payload={
                    "title": "Synthetic deployment revision",
                    "text": revised,
                    "baseline_id": baseline["id"],
                },
            )
            check(
                "revision linked",
                revision["comparison"]["baseline_id"] == baseline["id"],
            )
            if not live:
                check(
                    "curated comparison",
                    revision["comparison"]["counts"]["no_longer_flagged"] == 3
                    and revision["comparison"]["counts"]["remains"] == 2,
                )
            check(
                "revision has independent decision",
                revision["status"] == "awaiting_review",
            )
            path = "/api/review/contracts/" + revision["id"]
            request(
                "POST",
                path + "/decision",
                token=token,
                payload={
                    "decision": "rejected",
                    "reason": "Synthetic verification: remaining terms require negotiation.",
                },
            )
            request(
                "POST",
                path + "/decision",
                token=token,
                payload={
                    "decision": "approved",
                    "reason": "A second decision must be blocked.",
                },
                expected=409,
            )
            check("decision immutable", True)
            check(
                "audit consistent",
                request("GET", path + "/audit", token=token)["valid"],
            )
            bundle = request("GET", path + "/export", token=token)
            check(
                "complete evidence export",
                bundle["review"]["id"] == revision["id"]
                and bundle["audit"]["valid"]
                and bool(bundle["playbook"]),
            )
            printable = request("GET", path + "/report", token=token)
            check(
                "printable report contains reviewed agreement",
                "contractIQ" in printable["html"]
                and "Complete reviewed text" in printable["html"],
            )
            other = request("POST", "/api/review/auth/demo", payload={})["token"]
            try:
                for suffix in ("", "/report", "/export", "/audit"):
                    request("GET", path + suffix, token=other, expected=404)
                request(
                    "POST",
                    "/api/review/contracts",
                    token=other,
                    payload={"text": config["sample"], "baseline_id": baseline["id"]},
                    expected=404,
                )
                check("cross-session isolation", True)
            finally:
                request("POST", "/api/review/auth/logout", token=other, payload={})
            request("POST", "/api/review/auth/logout", token=token, payload={})
            request("GET", path, token=token, expected=401)
            check("logout revokes access", True)
            if live and not guest_live:
                token = request(
                    "POST",
                    "/api/review/auth/google",
                    payload={"credential": credential},
                )["token"]
                check(
                    "Google identity recovers saved review",
                    request("GET", path, token=token)["status"] == "rejected",
                )
        finally:
            # Best-effort cleanup of session credentials; review records remain for audit.
            client.post(
                "/api/review/auth/logout",
                headers={"Authorization": "Bearer " + token},
                json={},
            )
    report["result"] = "passed"
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Requires Google ID token; reviews and chat consume model credits",
    )
    parser.add_argument(
        "--guest-live",
        action="store_true",
        help="Exercise live uploads, reviews and chat using a free guest session; consumes model credits",
    )
    parser.add_argument("--require-live-config", action="store_true")
    parser.add_argument(
        "--output", type=Path, default=Path("/tmp/contractiq-deployment-report.json")
    )
    args = parser.parse_args()
    report = run(
        args.base_url,
        args.live or args.guest_live,
        args.require_live_config,
        args.guest_live,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
