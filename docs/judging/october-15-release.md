# October 15 submission checklist

## October 10–11: complete and verify the core

Implemented: source-grounded reviews, revision linkage, exact text changes, comparison outcomes, isolated access, independent human decisions, a 20-case synthetic evaluation corpus, live evaluation CLI, latency/token/cost reporting, and a deployment smoke script.

Updated October 11, 2026: PR #1 is merged to main and the full-stack app is live on Render. A live guest review through OpenRouter succeeded on independent synthetic text, returning five findings with source quotes. The account owner subsequently confirmed working Google sign-in. The live 20-case regression is complete (100% rule recall, 91.3% precision, no failed cases); two renewal-threshold false positives remain. This corpus informed development. Durable production storage, unseen-case evaluation, and practitioner results remain outstanding. The original repository has separate legacy CI failures; do not describe every check as passing. See [submission evidence and gaps](submission.md).

## October 11–12: real integrations and deployment

Required from the account owner:

- Keep the working `GOOGLE_CLIENT_ID` configuration. Repeat browser sign-in after the Next.js deployment; setup is documented in the [Google guide](../google-login-setup.md).
- Keep the working OpenRouter key, base URL, and model settings together. Add current provider prices only if cost estimates are needed.
- Use the existing Render service `contractiq-frontend`, now serving the complete app. The public URL is https://contractiq-frontend-2e3u.onrender.com/.
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
