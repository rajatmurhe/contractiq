"""Compare verified findings by playbook rule, without declaring legal resolution."""

from difflib import SequenceMatcher
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
    old_lines, new_lines = before.get("text", "").splitlines(), after.get("text", "").splitlines()
    passages = []
    for operation, start, end, revised_start, revised_end in SequenceMatcher(
        None, old_lines, new_lines
    ).get_opcodes():
        if operation != "equal":
            passages.append(
                {
                    "operation": operation,
                    "before_line": start + 1,
                    "after_line": revised_start + 1,
                    "before": "\n".join(old_lines[start:end]),
                    "after": "\n".join(new_lines[revised_start:revised_end]),
                }
            )
    return {
        "changed_passages": passages,
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
