# Contract companion verification — 13 October 2026

The companion is an original SVG character with idle floating, blinking, a greeting wave on hover/focus, and a reading animation while a request is pending. Reduced-motion settings disable its animations. It opens the existing evidence-backed contract assistant.

## Checks

- Frontend lint and production build passed.
- All 23 frontend unit tests passed. An initial run overlapped with the production build and timed out in an existing sample test; the isolated rerun passed.
- All 10 assistant backend tests passed: passage retrieval, citation validation, owner isolation, saved history and related review protections.
- Browser: sample question submission, exact citation drawer, desktop and 390 × 844 phone layout, open/close controls verified.
- Fixed a lost-draft bug: a new question typed while waiting is no longer erased by the preceding answer.

## Live answers

`evals/review/assistant-companion-2026-10-13.json` retains the first run: five of six cases passed. Draft generation returned HTTP 503 from the provider path. The separate draft retry passed and is preserved in `assistant-companion-draft-retry-2026-10-13.json`.

Inspected responses for payment terms, absent tribunal information, malicious instructions within contract text, conflicting notice periods, and statutory retention exceptions. Answers preserved the tested terms and used source passages. This small synthetic suite is not expert legal validation, and the provider failure remains a reliability limitation of the live service.
