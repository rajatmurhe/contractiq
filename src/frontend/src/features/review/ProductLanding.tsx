import type { RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Fingerprint,
  GitBranch,
  Layers3,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Props = {
  ready: boolean;
  busy: boolean;
  start: () => void;
  evaluate: () => void;
  liveEnabled: boolean;
  googleRef: RefObject<HTMLDivElement | null>;
  googleConfigured: boolean;
};
export function ProductLanding({
  ready,
  busy,
  start,
  evaluate,
  liveEnabled,
  googleRef,
  googleConfigured,
}: Props) {
  return (
    <>
      <main className="enterprise-landing">
        <section className="product-hero">
          <div className="product-hero-copy">
            <div className="release-badge">
              <span />
              <span>SUPPLIER CONTRACT REVIEW</span>
              <ArrowUpRight size={13} />
            </div>
            <h1>
              Review supplier contracts.
              <br />
              <span>Check the clauses behind each finding.</span>
            </h1>
            <p>
              Upload an agreement to check liability, indemnity, renewal,
              termination, and data handling against your procurement playbook.
              Ask questions, compare revisions, and record your decision.
            </p>
            <div className="evaluation-callout" id="evaluation">
              <strong>Have a contract you want to understand?</strong>
              <p>
                Upload your contract, check the text, and get a review with
                clear explanations and source quotes. Start free. No credit card required.
              </p>
              <button
                className="ciq-button ciq-dark"
                onClick={evaluate}
                disabled={!ready || busy}
              >
                Review your own contract <ArrowRight size={16} />
              </button>
              <small>
                {!ready
                  ? "Checking review availability…"
                  : liveEnabled
                    ? "Upload a PDF, DOCX, or TXT, or paste your agreement. Your guest workspace lasts one hour. Export your review before leaving."
                    : "You can upload and inspect a document now. AI review is temporarily unavailable; explore the sample to see the workflow."}
              </small>
            </div>
            <div className="product-actions">
              <button
                className="ciq-button ciq-large"
                onClick={start}
                disabled={!ready || busy}
              >
                Review a sample agreement <ArrowRight size={18} />
              </button>
              <a href="#workflow" className="product-text-link">
                Explore the workflow <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="product-assurance">
              <span>
                <CheckCircle2 size={14} /> No account needed to start
              </span>
              <span>
                <LockKeyhole size={14} /> Source-linked findings
              </span>
            </div>
            <p className="product-legal-note">
              Before uploading, read our <a href="/privacy/">privacy policy</a> and
              {" "}<a href="/terms/">terms and conditions</a>.
            </p>
            <div ref={googleRef} className="google-signin" />
            {ready && !googleConfigured && (
              <small className="product-config">
                Google sign-in is currently unavailable. You can still open a
                guest workspace.
              </small>
            )}
          </div>
          <div className="hero-product-wrap">
            <div className="hero-product-label">
              <span>SUPPLIER AGREEMENT EXAMPLE</span>
              <span>01 / REVIEW</span>
            </div>
            <div className="hero-product">
              <div className="hero-rail">
                <div className="hero-app-icon">
                  <Layers3 size={20} />
                </div>
                <FileText size={18} />
                <ShieldCheck size={18} />
                <GitBranch size={18} />
                <div className="hero-rail-avatar">NS</div>
              </div>
              <div className="hero-product-content">
                <div className="hero-product-toolbar">
                  <span>
                    Workspace <span>/</span> Contract review
                  </span>
                  <span className="hero-sample">SAMPLE</span>
                </div>
                <div className="hero-document-heading">
                  <div className="hero-document-icon">
                    <FileText size={24} />
                  </div>
                  <div>
                    <strong>Meridian Cloud</strong>
                    <span>Master services agreement</span>
                  </div>
                  <span className="hero-awaiting">Needs review</span>
                </div>
                <p className="hero-example-note">Illustrative clause from our synthetic sample agreement.</p>
                <div className="hero-review-card">
                  <div>
                    <span className="ciq-severity critical">CRITICAL</span>
                    <span>01 / LIABILITY</span>
                  </div>
                  <h3>
                    Liability has no stated cap.
                  </h3>
                  <blockquote>
                    Customer's liability under this Agreement is{" "}
                    <mark>
                      unlimited, including indirect and consequential damages.
                    </mark>
                  </blockquote>
                  <div className="hero-source-link">
                    <ScanLine size={14} /> Matched to source · Section 1{" "}
                    <ArrowUpRight size={14} />
                  </div>
                </div>
                <div className="hero-resolution">
                  <span>
                    <Sparkles size={16} /> Suggested next step
                  </span>
                  <p>Negotiate a cap at twelve months of fees.</p>
                </div>
                <button
                  onClick={start}
                  disabled={!ready || busy}
                  className="hero-open"
                >
                  Explore this sample review <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="hero-evidence-note">
              <span>
                <Fingerprint size={21} />
              </span>
              <div>
                <strong>Evidence you can inspect</strong>
                <p>Exact quotes. Verified locations. Your final call.</p>
              </div>
              <CheckCircle2 size={18} />
            </div>
          </div>
        </section>
        <div className="product-principles">
          <span>DESIGNED AROUND YOUR DECISION</span>
          <div>
            <ScanLine size={19} /> Traceable findings
          </div>
          <div>
            <ShieldCheck size={19} /> Human approval
          </div>
          <div>
            <Fingerprint size={19} /> Auditable decisions
          </div>
        </div>
        <section className="product-workflow" id="workflow">
          <div className="product-section-heading">
            <div>
              <span className="product-kicker">
                REVIEW WORKFLOW
              </span>
              <h2>
                Upload, inspect, and decide.
              </h2>
            </div>
            <p>
              A connected workflow for procurement teams.
              <br />
              Read the source, understand the risk, and decide
              <br />
              what happens next in one workspace.
            </p>
          </div>
          <div className="product-steps">
            {[
              {
                n: "01",
                Icon: FileText,
                title: "Bring the agreement",
                body: "Upload a PDF, DOCX, or TXT, or paste contract text. Review against five explicit commercial playbook rules.",
                label: "One focused workspace",
              },
              {
                n: "02",
                Icon: ScanLine,
                title: "See the evidence",
                body: "Inspect risks alongside the exact clauses. Compare the original wording with proposed negotiation language.",
                label: "Every quote, checked",
              },
              {
                n: "03",
                Icon: FileCheck2,
                title: "Own the decision",
                body: "Approve a review or request changes with a reason. Export the evidence and a record of your decision.",
                label: "You stay in control",
              },
            ].map(({ n, Icon, title, body, label }) => (
              <article key={n}>
                <div>
                  <span className="product-step-icon">
                    <Icon size={24} />
                  </span>
                  <span className="product-step-number">{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="product-step-label">
                  <Check size={14} />
                  {label}
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="product-trust">
          <div className="product-trust-art">
            <div>
              <ScanLine size={42} />
            </div>
            <span className="trust-orbit one" />
            <span className="trust-orbit two" />
            <span className="trust-coordinate a">SOURCE</span>
            <span className="trust-coordinate b">EVIDENCE</span>
            <span className="trust-coordinate c">DECISION</span>
          </div>
          <div>
            <span className="product-kicker">SOURCE CHECKS</span>
            <h2>
              Inspect the source before acting.
            </h2>
            <p>
              contractIQ checks that quoted text appears in the agreement.
              Review the full clause and its exceptions before using a finding
              or proposed wording. Source matching does not prove an interpretation is correct.
            </p>
            <div className="trust-checks">
              <span>
                <CheckCircle2 size={17} /> Source-linked findings
              </span>
              <span>
                <CheckCircle2 size={17} /> No automatic contract signing
              </span>
              <span>
                <CheckCircle2 size={17} /> Negotiation language you can copy
              </span>
            </div>
          </div>
        </section>
        <section className="product-pricing" id="pricing">
          <div className="product-section-heading">
            <div>
              <span className="product-kicker">
                FREE EARLY ACCESS · PLANNED PRICING
              </span>
              <h2>
                Free early access. Proposed plans below.
              </h2>
            </div>
            <p>
              All review features are free during early access.
              <br />
              The plans below show our proposed launch pricing.
              <br />
              No subscription is required today. Usage limits apply.
            </p>
          </div>
          <div className="product-plans">
            {[
              {
                name: "Starter",
                price: "$49",
                description: "For independent procurement leads.",
                volume: "50 reviews / month",
                label: "Start reviewing",
              },
              {
                name: "Team",
                price: "$199",
                description: "For a growing review practice.",
                volume: "300 reviews / month",
                label: "Start reviewing",
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For organizations with tailored requirements.",
                volume: "Custom review volume",
                label: "Start reviewing",
              },
            ].map((p, i) => (
              <article className={i === 1 ? "featured" : ""} key={p.name}>
                <div className="plan-name">
                  {p.name}
                  {i === 1 && <span>FOR GROWING TEAMS</span>}
                </div>
                <h3>
                  {p.price}
                  {i < 2 && <small>/ month</small>}
                </h3>
                <p>{p.description}</p>
                <button
                  className={`ciq-button ${i === 1 ? "ciq-dark" : ""}`}
                  onClick={evaluate}
                  disabled={!ready || busy}
                >
                  {p.label}
                  <ArrowUpRight size={16} />
                </button>
                <div className="plan-features">
                  {[
                    p.volume,
                    "Evidence-linked findings",
                    "Negotiation draft suggestions",
                    "Decision record & review export",
                  ].map((f) => (
                    <span key={f}>
                      <Check size={15} />
                      {f}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="product-final-cta">
          <div>
            <span className="product-kicker">
              REVIEW YOUR AGREEMENT
            </span>
            <h2>
              Upload a supplier contract to begin.
            </h2>
          </div>
          <button
            className="ciq-button ciq-dark ciq-large"
            onClick={evaluate}
            disabled={!ready || busy}
          >
            Review your first agreement <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="ciq-footer">
        <span>
          contractIQ <small>CONTRACT INTELLIGENCE</small>
        </span>
        <span>Commercial review support. Human judgment required.</span>
        <nav aria-label="Legal information">
          <a href="/privacy/">Privacy policy</a>
          <a href="/terms/">Terms and conditions</a>
        </nav>
      </footer>
    </>
  );
}
