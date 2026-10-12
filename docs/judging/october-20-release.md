# October 20 submission checklist

Deadline supplied by the owner: October 20, 2026. Exact time and time zone remain unconfirmed.

## October 12–15: validate the customer workflow

- Review the [October 12 QA evidence](qa-2026-10-12.md), including failed model runs and remaining coverage errors.
- Run the [practitioner session](practitioner-validation.md) if a participant becomes available. No participant is currently available; no outcome is claimed.
- Merge the customer polish branch after reviewing code and CI. Review the storage impact first: the free Render service uses ephemeral SQLite and a deployment can discard saved reviews.
- Choose durable storage and confirm any hosting cost before changing plans. Verify backup and restore before real customer use.

## October 16–18: release verification

- Deploy the same-origin app with `Dockerfile.review`; preserve the existing Google and model configuration.
- Repeat browser Google sign-in, refresh, sign-out, and two-account isolation on the deployed release.
- Run the sample smoke test with `--require-live-config`.
- Run `scripts/verify_review_deployment.py https://YOUR-SERVICE --guest-live --require-live-config` using synthetic data. This consumes model credits and retains synthetic records.
- Recheck mobile layout, upload, source citations, revision upload, decision, printable report and JSON export.
- Verify persistence across restart/deploy and obtain actual practitioner feedback if available.

## October 19: freeze and rehearse

Rehearse the [three-minute demo](demo-script.md). Record the deployed version, repository link, measured limitations, architecture and proposed pricing. Do not present the curated sample as live inference or development regressions as unseen tests.

## October 20: submit

Confirm the organizer's exact cutoff and required format. Check live provider availability and login, then submit the verified URL and evidence. No submission is sent automatically.

Production follow-up: retention/deletion controls, organization authorization, backup recovery, independent review quality and commercial pricing validation remain required before broad customer rollout.
