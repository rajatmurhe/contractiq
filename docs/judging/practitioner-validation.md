# Practitioner validation protocol

Status: prepared, not yet conducted. No customer savings, testimonials, willingness to pay, or adoption claims have been validated.

## Participant and permission

Recruit one procurement or legal-operations practitioner for a 25-minute usability session. Obtain permission to record notes and use anonymized quotes. Use synthetic agreements initially. A customer document requires their authorization for the configured provider and storage; redaction alone is not automatic authorization. No outreach has been sent.

## Neutral invitation draft

“I'm testing a procurement contract-review prototype for an October 15 hackathon. Could you spend 25 minutes reviewing synthetic supplier terms? I'd like candid feedback on whether the evidence and revision comparison help your work. This isn't a sales call, and I won't use your name or quote publicly without permission.”

## Tasks

1. Ask how they currently review supplier agreements: frequency, existing tools, bottleneck, handoff, and accountable approver. Do not lead with a claimed time saving.
2. Have them review synthetic agreement A manually against P1–P5. Time the task and record flagged rules, missed rules, and false alarms.
3. Have them review a different, similarly difficult synthetic agreement B with ContractIQ. Time the task and record the same outcomes. Do not reuse identical text and call the improvement causal: memory is a confounder.
4. Ask them to locate evidence, challenge a suggestion, compare a revised agreement, and record a decision without coaching. Record points of confusion and whether any control misled them.
5. Ask what prevents real adoption, what their security reviewer would require, who pays, and what they'd compare this purchase against. Present proposed pricing only after learning current cost and workflow.
6. Ask permission for any public quote separately. Capture criticism as well as positive reactions.

With multiple participants, alternate manual-first and tool-first order. One participant provides qualitative evidence, not a statistically reliable ROI estimate.

## Session record (fill only after conducting the test)

| Observation | Actual result |
| --- | --- |
| Date / anonymous participant code / role | Not collected |
| Permission to record and quote | Not collected |
| Manual task time and findings | Not collected |
| Assisted task time and findings | Not collected |
| Missed risks / false positives per task | Not collected |
| Revision-comparison completion / confusion | Not collected |
| Suggested language accepted, edited, or rejected | Not collected |
| Purchase decision maker / alternatives / budget | Not collected |
| Biggest adoption blocker | Not collected |
| Verbatim quote and explicit permission | Not collected |

## Economics calculation

Measured minutes saved per review = manual minutes − assisted minutes. Keep negative values when the tool is slower. Estimated monthly labor value = measured minutes saved / 60 × customer's provided loaded hourly cost × their monthly review volume. Report sample size and task differences alongside this estimate.

Contribution estimate = subscription revenue − (review volume × measured model cost per review, including revisions and chat) − hosting allocation − support allocation. Use actual token usage and provider prices; do not use curated sample latency or zero sample model calls as live economics.

A before/after comparison includes at least two reviews. Avoid pricing as though a negotiation consumes one inference. $49 and $199 are hypotheses, not validated demand or implemented entitlements.
