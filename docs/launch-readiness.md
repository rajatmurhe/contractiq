# Launch status: blocked

Owner instruction on 16 October 2026: do not launch until a custom domain is connected, the favicon is present, and privacy and terms pages are ready.

The existing Render hackathon demo is already public. This branch is a pre-launch revision and must not be merged or deployed until the owner completes the items below. No takedown of the existing demo was requested.

## Owner actions

- Supply an owned custom domain and DNS access. Do not purchase a domain or paid hosting without authorization.
- Connect that domain in the existing Render service, configure the DNS values Render provides, and confirm HTTPS works before redirects are changed.
- Add the exact HTTPS origin to the Google OAuth web client's authorized JavaScript origins; verify Google sign-in on the domain.
- Supply a monitored private contact email. Set NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL at frontend build time and rebuild. Never use a public issue tracker for private contract requests.
- Confirm operator identity, applicable jurisdiction, retention decisions, provider settings, and final privacy and terms wording. The included pages are factual pre-launch drafts, not a legal-compliance certification.
- Confirm the favicon, legal routes, mobile layout, and full review workflow on the custom domain.

## Design rules for future changes

Use concrete product descriptions, plain surfaces, modest rectangular buttons, accessible contrast, and functional line icons. Do not add purple gradients, pill-shaped buttons, emoji icons, em dashes in product copy, cursor effects, excessive animation, stock AI imagery, fictitious endorsements, customer logos, or invented usage/performance metrics. Synthetic samples must be labeled. Keep factual disclosures of AI functionality and development history.

## Policy references

Privacy notice structure was checked against the ICO's guidance on information to provide: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/
This does not establish the operator's jurisdiction or compliance. Operator confirmation remains necessary.

## Local verification on 16 October 2026

Frontend lint, TypeScript production build, and 23 interaction tests passed. The landing page, privacy page, terms page, and SVG favicon returned HTTP 200 in the local FastAPI preview. Desktop and mobile captures were inspected; at a 390-pixel mobile viewport the landing page's scroll width was also 390 pixels. Legal pages render their pre-launch notice and remain excluded from search indexing.

No made-with-AI badge, fabricated testimonial, customer-logo claim, stock AI photo, emoji icon, or pointer-following effect was found in the active frontend. Sample hero counts were removed; actual review counts remain tied to review data.
