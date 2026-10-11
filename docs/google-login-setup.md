# Enable Google login for ContractIQ

The code already uses Google Identity Services and verifies the ID token on the FastAPI server. The remaining work is account configuration and testing the actual login flow.

## Configure the account

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project for ContractIQ.
2. Open **Google Auth Platform** and complete the branding setup. Use `ContractIQ` as the app name and your actual support/contact email. Choose an **External** audience so reviewers outside your organization can sign in. Complete any consent-screen requirements Google presents.
3. Open **Clients → Create client**. Select **Web application**, named `ContractIQ web`.
4. Under **Authorized JavaScript origins**, add exactly:

   ```text
   https://contractiq-frontend-2e3u.onrender.com
   ```

   Include the scheme; do not append `/dashboard`, `/api`, or another path. For optional local development add `http://localhost` and `http://localhost:8017`, then open the app using localhost.
5. Create the client. Copy its **client ID**, which ends in `.apps.googleusercontent.com`. ContractIQ's JavaScript callback flow does not require a redirect URI or a client secret.
6. In **Render → contractiq-frontend → Environment**, add `GOOGLE_CLIENT_ID` with that client ID. Save and deploy. Keep the existing OpenRouter settings unchanged.

Use only basic sign-in identity; ContractIQ does not request Drive, Gmail, or other business-tool access. Before judging, check Google's Audience and verification status and test with an account outside the project team. If the console restricts the app to test users, configure the intended test accounts or complete the steps Google requires for wider availability.

Source: [Google Identity Services setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Verify the real flow

- Wait for Render's new deployment to finish. Open the public app in a fresh browser tab; sign out of any guest workspace first.
- Use the Google sign-in button, complete the account chooser, and confirm a named reviewer workspace opens.
- Review a synthetic contract, sign out, and sign back in with the same Google account. The saved review should reopen while the underlying database persists.
- Sign in using a second Google account and verify the first account's review is unavailable.
- Test once on the actual presentation device and browser. A populated client ID or mocked unit test does not establish successful Google login.

The current free Render instance has ephemeral storage. Identity verification does not make saved reviews durable across deployments; configure persistent storage before promising that behavior.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Google button is missing | `GOOGLE_CLIENT_ID` on `contractiq-frontend`; deployment finished; no active guest session |
| Origin error | The exact public origin is registered on the same web client |
| Token rejected | Render uses the same client ID as the browser; the identity has a verified email |
| Account access restricted | Audience, applicable test-user restrictions, and Google verification status |
| Popup does not load | Browser popup/privacy settings and ability to load Google's identity script |

Keep model keys, Google ID tokens, and client secrets out of screenshots and Git. Only the public Google client ID is needed in this application.
