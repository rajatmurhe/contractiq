# ContractIQ: three-minute judging demonstration

## Positioning

ContractIQ helps procurement teams turn supplier agreements into evidence-backed negotiation decisions, with a human accountable for every approval.

Buyer hypothesis: procurement leads at growing software companies handling recurring supplier agreements. User task: identify deviations from an explicit commercial playbook, prepare negotiation changes, and verify the next draft. This is commercial review support, not an automated legal opinion.

## Before the presentation

- Use the deployed full-stack review URL, not the old frontend-only dashboard.
- Verify actual Google sign-in and a live review on the presentation device.
- Run `scripts/verify_review_deployment.py` against that URL. Keep the JSON results.
- Run the live evaluation and read the failures. Bring the report, not an invented accuracy number.
- Keep synthetic sample mode as the labeled fallback. Do not present its curated results as live AI.
- Keep customer-sensitive agreements out of the demo. Use the synthetic documents in this directory.
- Do not commit or display Google ID tokens or model keys. Clear terminal environment dumps before screen sharing.

## Demonstration

**0:00–0:20 — The customer job.**
“Supplier negotiations create multiple versions. A summary doesn't tell a procurement lead what still needs negotiation or where the evidence is. Here is our customer playbook: five explicit commercial preferences.”

**0:20–1:00 — Inspect evidence.**
Sign in and review `demo-original.txt` with the configured live model. Select liability. Show the exact source quotation and negotiation suggestion. Explain that quotes are validated against input and offsets computed by the server. A correct quote does not prove a correct interpretation.

**1:00–1:45 — The distinguishing workflow.**
Open Compare revision and paste `demo-revised.txt`. Show the exact text changes, still-flagged rules, newly flagged renewal restriction, and liability no longer flagged. These are expected outcomes to verify, not promised model output. If an expectation fails, explain the limitation rather than concealing it. Each revision retains an independent review and decision.

**1:45–2:15 — Human accountability.**
Return to Findings, inspect the remaining indemnity and new renewal term, then request changes with a specific rationale. Show execution and audit. Explain ownership isolation and why the audit is a local consistency check, not an externally anchored ledger. Approval never signs an agreement.

**2:15–2:40 — Measured AI.**
Show the actual evaluation report: rule recall/precision, missing topics, errors, latency, and estimated model cost. State model and corpus size. If the live benchmark is not complete, say so explicitly; corpus validation is not model evaluation. Explain the embedded-instruction and missing-clause cases.

**2:40–3:00 — Business and next step.**
“Our initial subscription hypothesis is $49 for 50 reviews or $199 for 300. We are testing whether evidence comparison reduces reviewer time while preserving accuracy. The next pilot measures both on equivalent contracts.” Use actual practitioner observations only if collected.

## Expected synthetic demonstration changes

- P1: uncapped liability becomes a twelve-month cap with indirect losses excluded.
- P2: one-sided indemnity remains unchanged.
- P3: the revised draft introduces a 90-day nonrenewal deadline.
- P4 and P5: remain aligned with the playbook.

The demo files are not part of the 20-case evaluation corpus. Once used for tuning, do not describe them as held-out or unseen. Ask the practitioner for another synthetic or approved redacted example for a genuine unseen test.

## Failure recovery

If inference or login fails, state the failure, switch to the explicitly curated sample, and show the saved benchmark separately. Do not turn off authentication, use hardcoded success responses, or change outcome labels to hide the failure. Keep one screenshot of the real successful deployed path as supporting evidence; it is not a substitute for current functionality.
