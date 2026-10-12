"""Portable, printable review report. All document and model text is escaped."""

# ruff: noqa: E501 — self-contained HTML and print CSS

from datetime import UTC, datetime
from html import escape
from typing import Any


def printable_report(bundle: dict[str, Any]) -> str:
    review = bundle["review"]

    def text(value: object) -> str:
        return escape(str(value), quote=True)

    def block(value: object) -> str:
        return f'<div class="prose">{text(value)}</div>'

    findings = (
        "".join(
            f'<article><p class="label">{text(f["id"])} · {text(f["rule"])} · '
            f"{text(f['severity']).upper()}</p><h3>{text(f['title'])}</h3>"
            f'<blockquote>{text(f["quote"])}</blockquote><p class="muted">Source line '
            f"{text(f['line'])}</p><h4>Why it matters</h4>{block(f['rationale'])}"
            f"<h4>Suggested negotiation language</h4>{block(f['proposed_language'])}</article>"
            for f in review["findings"]
        )
        or "<p>No deviations were returned. This does not establish that every term is acceptable.</p>"
    )
    comparison = review.get("comparison")
    revisions = ""
    if comparison:
        passages = "".join(
            f"<article><h3>Change {i + 1}</h3><h4>Before</h4>{block(p['before'])}"
            f"<h4>After</h4>{block(p['after'])}</article>"
            for i, p in enumerate(comparison.get("changed_passages", []))
        )
        revisions = (
            "<section><h2>Revision comparison</h2><p>Compared with "
            f"{text(comparison['baseline_title'])}</p>{block(comparison['notice'])}"
            f"{passages}</section>"
        )
    status = {
        "awaiting_review": "Awaiting your decision",
        "approved": "Review approved",
        "rejected": "Changes requested",
    }.get(review["status"], review["status"])
    missing = ", ".join(review.get("missing_topics", [])) or "None reported"
    exported = datetime.fromtimestamp(bundle["exported_at"], UTC).strftime("%d %b %Y, %H:%M UTC")
    audit = "Consistent" if bundle["audit"]["valid"] else "Verification failed — inspect the audit"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>{text(review["title"])} — contractIQ review</title>
<style>
body{{margin:0;background:#f4f6fa;color:#19283e;font:15px/1.65 system-ui,sans-serif}}
main{{max-width:850px;margin:32px auto;padding:48px;background:white;border:1px solid #e1e6ef}}
h1{{font-size:32px;line-height:1.2}}h2{{margin-top:32px;border-bottom:1px solid #dae1eb;padding-bottom:10px}}
h3{{font-size:19px;margin-top:8px}}h4{{margin-bottom:6px}}.brand{{font-size:23px;font-weight:750}}
.muted,.label{{color:#52637a}}.label{{font-size:12px;font-weight:650;letter-spacing:.05em}}
article{{padding:16px 0;border-bottom:1px solid #e1e6ef;break-inside:avoid}}
blockquote{{margin:12px 0;border-left:3px solid #4165ba;padding:12px 18px;background:#f3f6fc;white-space:pre-wrap}}
.prose{{white-space:pre-wrap;overflow-wrap:anywhere}}.note{{background:#f4f6fa;padding:14px 18px}}
.meta{{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}}small{{display:block;color:#52637a}}
@media(max-width:600px){{main{{margin:0;padding:22px}}.meta{{grid-template-columns:1fr}}}}
@media print{{@page{{margin:18mm}}body{{background:white;font-size:10pt}}main{{padding:0;margin:0;border:0;max-width:none}}.print-help{{display:none}}h2,h3,h4{{break-after:avoid}}}}
</style></head><body><main>
<div class="brand">contractIQ</div><p class="label">CONTRACT REVIEW REPORT</p>
<h1>{text(review["title"])}</h1>
<p class="print-help note">Use your browser’s Print command to print this report or save it as a PDF.
This file contains your agreement and review. Share it only with intended recipients.</p>
<div class="meta"><div><strong>{text(status)}</strong><small>Human decision</small></div>
<div><strong>{len(review["findings"])} findings</strong><small>Source quotations verified</small></div>
<div>{text(exported)}<small>Exported</small></div><div>{text(review["mode"])} · {text(review["model"])}<small>Review source</small></div></div>
<p class="note">{text(bundle["notice"])} Findings cover five procurement preferences.
An exact quotation verifies its source, not the correctness or completeness of its interpretation.</p>
<section><h2>Decision</h2>{block(review.get("decision_reason") or "No decision has been recorded.")}
<p><strong>Topics not found:</strong> {text(missing)}. Check these against the complete agreement.</p></section>
<section><h2>Findings and suggested changes</h2>{findings}</section>{revisions}
<section><h2>Review playbook</h2>{block(bundle["playbook"])}</section>
<section><h2>Complete reviewed text</h2>{block(review["text"])}</section>
<section><h2>Record details</h2><p>Review ID: {text(review["id"])}<br>Audit check: {text(audit)}</p>
{block(bundle["audit"].get("scope", "Local audit consistency only."))}
<p>Export JSON from the workspace for the complete machine-readable audit and review data.</p></section>
</main></body></html>"""
