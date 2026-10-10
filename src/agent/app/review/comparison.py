"""Compare verified findings by playbook rule, without declaring legal resolution."""

from typing import Any


def compare_reviews(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    changes = []
    for rule in ("P1", "P2", "P3", "P4", "P5"):
        old = [f for f in before["findings"] if f["rule"] == rule]
        new = [f for f in after["findings"] if f["rule"] == rule]
        if not old and not new:
            continue
        state = "remains" if old and new else "newly_flagged" if new else "no_longer_flagged"
        # Missing coverage makes disappearance ambiguous, rather than evidence of resolution.
        if old and not new and after.get("missing_topics"):
            state = "needs_verification"
        changes.append({"rule": rule, "state": state, "before": old, "after": new})
    return {
        "baseline_id": before["id"],
        "baseline_title": before["title"],
        "changes": changes,
        "counts": {
            state: sum(c["state"] == state for c in changes)
            for state in ("remains", "newly_flagged", "no_longer_flagged", "needs_verification")
        },
        "notice": (
            "Compared by playbook rule, not individual clause identity. No longer flagged does "
            "not prove resolution: inspect the revised text and missing topics before deciding."
        ),
    }
