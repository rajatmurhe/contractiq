# October 15 submission checklist

## October 10–11: complete and verify the core

Implemented: source-grounded reviews, revision linkage, exact text changes, comparison outcomes, isolated access, independent human decisions, a 20-case synthetic evaluation corpus, live evaluation CLI, latency/token/cost reporting, and a deployment smoke script.

Verification so far is local and uses curated sample data or mocked providers. Real Google login, live inference, public deployment, and practitioner results are outstanding. The original repository has separate legacy CI failures; do not describe every check as passing.

## October 11–12: real integrations and deployment

Required from the account owner:

- Configure `GOOGLE_CLIENT_ID` for a web client with localhost and the final HTTPS app origin.
- Configure `REVIEW_LLM_API_KEY`, model and provider base URL in the server environment. Add current token prices if cost estimates are needed.
- Sign in to Render or provide access through an approved deployment mechanism. The current browser is at Render sign-in. No service has been created and no paid plan purchased.
- Choose persistent hosting and approve any associated spending. `render.review.yaml` requests a disk; that is not a free hosting commitment.

Deploy the same-origin Docker service using `Dockerfile.review`, not the old frontend service by itself. Follow `docs/review-pilot.md`. Run:

```sh
.venv/bin/python scripts/verify_review_deployment.py https://YOUR-REVIEW-SERVICE --require-live-config
```

That checks configuration presence and the sample workflow, not real Google/model correctness. Then use the actual Google browser login and a synthetic live review. Optionally run the live API smoke test with an ephemeral Google ID token supplied privately through `REVIEW_SMOKE_GOOGLE_ID_TOKEN`:

```sh
.venv/bin/python scripts/verify_review_deployment.py https://YOUR-REVIEW-SERVICE --live --require-live-config
```

This makes two model calls and retains synthetic review records. Do not paste the token into chat, a command argument, screenshots, reports, or Git. Clear it afterward. Verify persistence across a deployment/restart and isolation with two distinct real Google accounts. The automated sample isolation test does not replace that Google account check.

## October 12–13: measure and learn

Run the live corpus evaluation, inspect each failure, and fix substantive errors. Re-run after model/prompt changes. Save the model, corpus hash, timestamp, results and limitations. Execute the practitioner protocol; document actual findings and product changes. Do not fabricate a participant if none is available.

## October 14: freeze and rehearse

Rehearse the three-minute script on the final public URL. Check desktop and mobile. Verify login and provider quotas. Prepare a short screen recording, architecture explanation, real benchmark report, repository link, proposed business model, and transparent limitations. Keep secrets out of the recording. Do not add large new features during the freeze.

## October 15: final verification and submission

Run deployment smoke checks, manually verify actual Google + live inference again, and submit the verified full-stack URL. Confirm the organizer's exact deadline time and required submission format; only the date has been supplied so far. Merge only after reviewing the deployment impact and outstanding legacy checks. No submission has been sent automatically.
