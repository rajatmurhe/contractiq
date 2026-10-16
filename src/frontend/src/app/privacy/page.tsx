import type { Metadata } from "next";
import { LegalPage } from "../../components/legal/LegalPage";
export const metadata: Metadata = { title: "Privacy policy | contractIQ", robots: { index: false, follow: true } };
export default function PrivacyPage() {
  return <LegalPage title="Privacy policy">
    <p>This notice describes how the current contractIQ early-access service handles information when you upload an agreement, use AI review, or sign in.</p>
    <section><h2>Information we process</h2>
      <ul>
        <li>Documents you upload for text extraction, contract text and titles you submit for review, and linked revisions.</li>
        <li>Your questions, generated answers, findings, proposed wording, decisions and reasons, timestamps, and audit records. Up to 20 conversation turns are kept per agreement.</li>
        <li>When you sign in with Google, your identity token is verified, including its verified-email status. The application stores your Google account identifier and display name to associate your sessions with your reviews.</li>
        <li>Guest session identifiers and expiry times. The browser uses session storage to keep the session token and selected review identifier.</li>
        <li>Operational request information handled by the hosting service. The application uses request or account identifiers to limit abuse.</li>
      </ul>
    </section>
    <section><h2>Why we use this information</h2>
      <p>We use it to extract text, generate the review or answer you request, compare drafts, save your decisions, provide exports, identify your workspace, and operate and protect the service. Sample mode uses synthetic agreements and prepared findings.</p>
    </section>
    <section><h2>AI providers and other services</h2>
      <p>Uploading a file sends it to the contractIQ server for extraction. Starting AI review sends the submitted contract text to the configured model provider. Asking a question sends relevant document passages and conversation context to that provider. Extraction alone does not start AI review.</p>
      <p>The current deployment uses Render for hosting, Groq for model inference, and Google for optional sign-in. Their processing locations and retention rules may differ from your location and are governed by their service terms and the operator’s account settings. contractIQ does not promise zero provider retention.</p>
      <p>Read the <a href="https://render.com/privacy">Render privacy policy</a>, <a href="https://groq.com/privacy-policy/">Groq privacy policy</a>, and <a href="https://policies.google.com/privacy">Google privacy policy</a>. Provider changes require this notice to be updated before launch.</p>
    </section>
    <section><h2>Storage and retention</h2>
      <p>Reviews, conversations, decisions, and audit records are stored in the application database. Guest access lasts one hour; expiry and sign-out do not themselves delete saved reviews. The current deployment has no automatic review-retention schedule. Records remain until deleted or the hosting storage is reset.</p>
      <p>Free hosting may reset the database during a deployment or restart. Export important reviews and keep your own copy. The service is not a durable document archive.</p>
    </section>
    <section><h2>Access, export, and deletion</h2>
      <p>While you can access a review, you can export it and delete its active review, conversation, and local audit records using “Your data and privacy.” Delete linked revisions before deleting the original. This action does not delete records independently retained by infrastructure or model providers, or any separate host backups.</p>
      <p>If you lose guest access, contact the operator using the private channel below. Access, correction, deletion, and other requests require enough information to locate the record and verify your authority. Any additional rights depend on the law that applies to you.</p>
    </section>
    <section><h2>Browser storage and third parties</h2>
      <p>The application uses session storage for workspace access. The current application does not include advertising trackers or an analytics SDK. Google sign-in loads Google’s identity service, and hosting services process technical requests under their own policies.</p>
    </section>
    <section><h2>Documents you are allowed to submit</h2>
      <p>Only submit agreements and personal information you are authorized to share with this service and its AI provider. Use synthetic or appropriately redacted documents when evaluating the product. Do not submit passwords or API keys.</p>
    </section>
    <section><h2>Changes to this notice</h2><p>The date above identifies this version. Material changes to providers, processing, or retention must be reflected here. This draft still requires the operator’s confirmation of contact details and applicable legal obligations before launch.</p></section>
  </LegalPage>;
}
