import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Fingerprint,
  Loader2,
  LockKeyhole,
  MessageSquare,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import "./review.css";

type Session = { token: string; name: string; demo: boolean };
type Finding = {
  id: string;
  title: string;
  severity: string;
  rule: string;
  quote: string;
  rationale: string;
  proposed_language: string;
  start: number;
  end: number;
  line: number;
};
type Review = {
  id: string;
  title: string;
  text: string;
  status: string;
  findings: Finding[];
  missing_topics: string[];
  mode: string;
  model: string;
  elapsed_ms: number;
  trace: string[];
  decision_reason?: string;
};
type Config = {
  google_client_id: string;
  live_enabled: boolean;
  sample: string;
  playbook: string;
};
type History = { id: string; title: string; status: string };
type Audit = {
  valid: boolean;
  scope: string;
  events: { action: string; timestamp: number; hash: string }[];
};
type Google = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (node: HTMLElement, options: object) => void;
    };
  };
};

async function api<T>(
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/review${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Request failed. Please check your input and try again.",
    );
  return data;
}

export default function ReviewExperience() {
  const [config, setConfig] = useState<Config>();
  const [session, setSession] = useState<Session>();
  const [review, setReview] = useState<Review>();
  const [history, setHistory] = useState<History[]>([]);
  const [selected, setSelected] = useState(0);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Supplier agreement");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [audit, setAudit] = useState<Audit>();
  const [tab, setTab] = useState<"findings" | "audit" | "playbook">("findings");
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMode, setChatMode] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const googleButton = useRef<HTMLDivElement>(null);
  const evidence = useRef<HTMLElement>(null);

  useEffect(() => {
    api<Config>("/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!config?.google_client_id || session) return;
    const mount = () => {
      const google = (window as unknown as { google?: Google }).google;
      if (!google || !googleButton.current) return;
      google.accounts.id.initialize({
        client_id: config.google_client_id,
        callback: async (response) => {
          try {
            const s = await api<Session>("/auth/google", undefined, {
              credential: response.credential,
            });
            setSession(s);
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        },
      });
      google.accounts.id.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
      });
    };
    if ((window as unknown as { google?: Google }).google) {
      mount();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = mount;
    script.onerror = () =>
      setError("Google sign-in could not load. You can still try the sample.");
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [config?.google_client_id, session]);
  useEffect(() => {
    if (session)
      api<History[]>("/contracts", session.token)
        .then(setHistory)
        .catch((e) => setError(e.message));
  }, [session, review]);
  useEffect(() => {
    evidence.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected, review?.id]);

  async function startDemo() {
    setBusy("Preparing sample");
    setError("");
    try {
      const s = await api<Session>("/auth/demo", undefined, {});
      setSession(s);
      const r = await api<Review>("/contracts", s.token, {
        title: "Meridian Cloud · Master services agreement",
        text: config!.sample,
      });
      setReview(r);
      setSelected(0);
      setReason("");
      setAudit(undefined);
      setAnswer("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function analyze() {
    setBusy("Reviewing against your playbook");
    setError("");
    try {
      const r = await api<Review>("/contracts", session!.token, {
        title,
        text,
      });
      setReview(r);
      setSelected(0);
      setReason("");
      setAudit(undefined);
      setAnswer("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function decide(decision: string) {
    setBusy("Recording decision");
    setError("");
    try {
      setReview(
        await api<Review>(`/contracts/${review!.id}/decision`, session!.token, {
          decision,
          reason,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function showAudit() {
    setTab("audit");
    setError("");
    try {
      setAudit(
        await api<Audit>(`/contracts/${review!.id}/audit`, session!.token),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setChatBusy(true);
    setAnswer("");
    setCitations([]);
    try {
      const data = await api<{
        answer: string;
        mode: string;
        citations?: string[];
      }>(
        review ? `/contracts/${review.id}/ask` : "/assistant",
        review ? session?.token : undefined,
        { question },
      );
      setAnswer(data.answer);
      setChatMode(data.mode);
      setCitations(data.citations || []);
    } catch (e) {
      setAnswer((e as Error).message);
      setChatMode("error");
    } finally {
      setChatBusy(false);
    }
  }
  function download() {
    const content =
      `# ${review!.title}\n\nMode: ${review!.mode}\nStatus: ${review!.status}\nModel: ${review!.model}\n\n` +
      review!.findings
        .map(
          (f) =>
            `## ${f.id}: ${f.title} (${f.severity})\n\nSource, line ${f.line}: ${f.quote}\n\n${f.rationale}\n\nProposed language (requires legal review): ${f.proposed_language}\n`,
        )
        .join("\n") +
      `\nDecision reason: ${review!.decision_reason || "Pending"}\n\nCommercial playbook review; not a legal opinion.\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "contractiq-review.md";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function signOut() {
    try {
      await api("/auth/logout", session?.token, {});
      setSession(undefined);
      setReview(undefined);
      setAudit(undefined);
      setHistory([]);
      setText("");
      setAnswer("");
      setReason("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const finding = review?.findings[selected];
  const sourceChars = useMemo(
    () => Array.from(review?.text || ""),
    [review?.text],
  );
  return (
    <div className="ciq">
      <header className="ciq-header">
        <a href="/" className="ciq-brand">
          <span>
            <Scale size={21} />
          </span>
          contract<span className="ciq-brand-iq">iq</span>
          <small> / INTELLIGENCE, WITH EVIDENCE</small>
        </a>
        <nav>
          {!session ? (
            <>
              <a href="#workflow">How it works</a>
              <a href="#pricing">Pricing</a>
              <button
                className="ciq-button ciq-dark"
                onClick={startDemo}
                disabled={!config || !!busy}
              >
                Try the demo <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <>
              <span className="ciq-user">{session.name}</span>
              <button
                className="ciq-button ciq-plain"
                onClick={signOut}
                disabled={!!busy}
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </header>
      {error && (
        <div className="ciq-error" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {!session ? (
        <>
          <main className="ciq-landing">
            <section className="ciq-hero">
              <div className="ciq-hero-copy">
                <div className="ciq-eyebrow">
                  <span /> BUILT FOR THE OTHER SIDE OF THE SIGNATURE
                </div>
                <h1>
                  Before you sign,
                  <br />
                  see the <em>whole risk.</em>
                </h1>
                <p>
                  Turn supplier agreements into a clear decision. Find the
                  clause, understand the exposure, and negotiate with evidence
                  on your side.
                </p>
                <div className="ciq-hero-actions">
                  <button
                    className="ciq-button ciq-dark ciq-large"
                    disabled={!config || !!busy}
                    onClick={startDemo}
                  >
                    Review a sample agreement <ArrowRight size={18} />
                  </button>
                  <div ref={googleButton} />
                </div>
                <div className="ciq-hero-note">
                  <ShieldCheck size={15} /> Synthetic sample. No signup
                  required.
                </div>
                {!config?.google_client_id && config && (
                  <p className="ciq-config-note">
                    Google sign-in and private reviews are not configured on
                    this instance.
                  </p>
                )}
              </div>
              <div className="ciq-preview">
                <div className="ciq-preview-top">
                  <span>
                    <FileText size={17} /> Meridian Cloud / MSA
                  </span>
                  <span className="ciq-pill">SAMPLE REVIEW</span>
                </div>
                <div className="ciq-preview-body">
                  <div className="ciq-overline">
                    YOUR ATTENTION, WHERE IT MATTERS
                  </div>
                  <div className="ciq-preview-score">
                    <strong>5</strong>
                    <span>
                      playbook deviations
                      <br />
                      <small>Every finding linked to source text</small>
                    </span>
                    <div className="ciq-spark">
                      <Sparkles />
                    </div>
                  </div>
                  <div className="ciq-preview-clause">
                    <span className="ciq-severity critical">
                      CRITICAL · LIABILITY
                    </span>
                    <h3>
                      A small clause.
                      <br />
                      An unlimited exposure.
                    </h3>
                    <blockquote>
                      “Customer’s liability under this Agreement is{" "}
                      <mark>unlimited</mark>, including indirect and
                      consequential damages.”
                    </blockquote>
                    <div className="ciq-evidence">
                      <CheckCircle2 size={14} /> Exact source citation · Section
                      1
                    </div>
                  </div>
                  <div className="ciq-preview-row">
                    <span>
                      <span className="ciq-dot" /> One-sided indemnification
                    </span>
                    <span>
                      HIGH <ChevronRight size={14} />
                    </span>
                  </div>
                  <div className="ciq-preview-row">
                    <span>
                      <span className="ciq-dot amber" /> Early renewal lock-in
                    </span>
                    <span>
                      MEDIUM <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
                <div className="ciq-preview-bottom">
                  <Fingerprint size={17} />
                  <span>AI proposes. Your team decides.</span>
                  <LockKeyhole size={15} />
                </div>
              </div>
            </section>
            <section id="workflow" className="ciq-workflow">
              <div className="ciq-section-title">
                <div>
                  <div className="ciq-overline">FROM DOCUMENT TO DECISION</div>
                  <h2>A review you can actually inspect.</h2>
                </div>
                <p>
                  Built for procurement teams who need an answer
                  <br />
                  and the evidence behind it.
                </p>
              </div>
              <div className="ciq-steps">
                {[
                  [
                    "01",
                    "Read against your playbook",
                    "Five explicit commercial rules bring consistency to supplier reviews.",
                    FileText,
                  ],
                  [
                    "02",
                    "Follow the evidence",
                    "Jump from each finding to its exact words in the source agreement.",
                    Search,
                  ],
                  [
                    "03",
                    "Make the human call",
                    "Record a reasoned decision and inspect the review’s audit chain.",
                    ShieldCheck,
                  ],
                ].map(([num, heading, desc, Icon]) => {
                  const I = Icon as typeof FileText;
                  return (
                    <article key={String(num)}>
                      <div>
                        <I size={22} />
                        <span>{String(num)}</span>
                      </div>
                      <h3>{String(heading)}</h3>
                      <p>{String(desc)}</p>
                    </article>
                  );
                })}
              </div>
            </section>
            <section id="pricing" className="ciq-pricing">
              <div className="ciq-section-title">
                <div>
                  <div className="ciq-overline">
                    A BUSINESS MODEL THAT SCALES WITH YOU
                  </div>
                  <h2>
                    Start with a contract.
                    <br />
                    Grow into a workflow.
                  </h2>
                </div>
                <p>
                  Proposed launch pricing.
                  <br />
                  No billing or payment collection in this pilot.
                </p>
              </div>
              <div className="ciq-plans">
                {[
                  [
                    "Starter",
                    "$49",
                    "50 reviews / month",
                    "For an independent procurement lead",
                  ],
                  [
                    "Team",
                    "$199",
                    "300 reviews / month",
                    "For a growing review practice",
                  ],
                  [
                    "Enterprise",
                    "Let’s talk",
                    "Custom review volume",
                    "For a scoped enterprise pilot",
                  ],
                ].map(([name, price, count, desc], i) => (
                  <article
                    className={i === 1 ? "ciq-plan-featured" : ""}
                    key={name}
                  >
                    <span className="ciq-overline">{name}</span>
                    <h3>
                      {price}
                      <small>{i < 2 ? "/mo" : ""}</small>
                    </h3>
                    <p>{desc}</p>
                    <div>
                      <Check size={16} />
                      {count}
                    </div>
                    <div>
                      <Check size={16} />
                      Evidence-linked findings
                    </div>
                    <div>
                      <Check size={16} />
                      Review export & decision record
                    </div>
                    <button
                      className="ciq-button"
                      onClick={startDemo}
                      disabled={!config || !!busy}
                    >
                      Explore the pilot <ArrowUpRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </main>
          <footer className="ciq-footer">
            <span>
              contractiq <small> / DeepSoft AI-FDE Hackathon</small>
            </span>
            <span>Commercial review support. Human judgment required.</span>
          </footer>
        </>
      ) : (
        <main className="ciq-workspace">
          <aside className="ciq-sidebar">
            <div className="ciq-overline">REVIEW WORKSPACE</div>
            <button
              className="ciq-new"
              disabled={!!busy}
              onClick={() => {
                setReview(undefined);
                setAudit(undefined);
                setAnswer("");
                setTab("findings");
              }}
            >
              <Plus size={16} /> New review
            </button>
            <div className="ciq-overline">RECENT AGREEMENTS</div>
            {history.map((h) => (
              <button
                className={`ciq-history ${h.id === review?.id ? "active" : ""}`}
                key={h.id}
                disabled={!!busy}
                onClick={async () => {
                  try {
                    setReview(
                      await api<Review>(`/contracts/${h.id}`, session.token),
                    );
                    setSelected(0);
                    setReason("");
                    setAudit(undefined);
                    setAnswer("");
                    setTab("findings");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <FileText size={16} />
                <span>
                  {h.title}
                  <small>{h.status.replaceAll("_", " ")}</small>
                </span>
              </button>
            ))}
            <div className="ciq-sidebar-foot">
              <ShieldCheck size={18} />
              <strong>
                {session.demo
                  ? "Isolated sample workspace"
                  : "Private review workspace"}
              </strong>
              <p>
                {session.demo
                  ? "Curated findings. No model calls. Sign out to access Google login."
                  : "Your reviews are scoped to your verified Google identity."}
              </p>
            </div>
          </aside>
          <section className="ciq-review-main">
            <div className="ciq-breadcrumb">
              Workspace <ChevronRight size={13} />{" "}
              {review ? "Agreement review" : "New review"}{" "}
              <span className="ciq-pill">
                {session.demo ? "SAMPLE MODE" : "LIVE WORKSPACE"}
              </span>
            </div>
            {!review ? (
              <div className="ciq-upload">
                <div className="ciq-overline">
                  EVERY GOOD DECISION STARTS WITH THE SOURCE
                </div>
                <h1>What are we reviewing?</h1>
                <p>
                  {session.demo
                    ? "Explore a synthetic supplier agreement with five curated deviations."
                    : "Paste your agreement or upload a UTF-8 text file. Contract text is sent to the configured AI provider."}
                </p>
                {session.demo ? (
                  <button
                    className="ciq-button ciq-dark"
                    onClick={startDemo}
                    disabled={!!busy}
                  >
                    Load sample agreement <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <label>
                      Agreement name
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={150}
                      />
                    </label>
                    <label>
                      Contract text
                      <textarea
                        rows={14}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={60000}
                        placeholder="Paste contract text here…"
                      />
                    </label>
                    <div className="ciq-upload-actions">
                      <label className="ciq-button ciq-file">
                        Choose .txt file
                        <input
                          type="file"
                          accept=".txt,text/plain"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 240000) {
                              setError(
                                "Choose a text file smaller than 240 KB.",
                              );
                              return;
                            }
                            try {
                              const value = await f.text();
                              if (value.length > 60000)
                                throw new Error(
                                  "The limit is 60,000 characters.",
                                );
                              setText(value);
                              setTitle(f.name);
                            } catch (err) {
                              setError((err as Error).message);
                            }
                          }}
                        />
                      </label>
                      <span>
                        {text.length.toLocaleString()} / 60,000 characters
                      </span>
                      <button
                        className="ciq-button ciq-dark"
                        onClick={analyze}
                        disabled={
                          !!busy ||
                          text.trim().length < 50 ||
                          !title.trim() ||
                          !config?.live_enabled
                        }
                      >
                        Analyze agreement <Sparkles size={16} />
                      </button>
                    </div>
                    {!config?.live_enabled && (
                      <p>
                        Live analysis requires model configuration on the
                        server.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="ciq-review-heading">
                  <div>
                    <div className="ciq-overline">
                      CONTRACT INTELLIGENCE /{" "}
                      {review.mode === "sample" ? "CURATED DEMO" : "AI REVIEW"}
                    </div>
                    <h1>{review.title}</h1>
                    <p>
                      {review.findings.length} verified citations <span>·</span>{" "}
                      {review.model}
                    </p>
                  </div>
                  <button className="ciq-button" onClick={download}>
                    <Download size={15} /> Export review
                  </button>
                </div>
                <div className="ciq-statusbar">
                  <span className={`ciq-status ${review.status}`}>
                    <span />
                    {review.status.replaceAll("_", " ")}
                  </span>
                  <span>Human approval required for every review</span>
                  <span>
                    <Fingerprint size={15} /> Evidence checked
                  </span>
                </div>
                <div className="ciq-tabs">
                  <button
                    className={tab === "findings" ? "active" : ""}
                    onClick={() => setTab("findings")}
                  >
                    Findings <small>{review.findings.length}</small>
                  </button>
                  <button
                    className={tab === "playbook" ? "active" : ""}
                    onClick={() => setTab("playbook")}
                  >
                    Commercial playbook
                  </button>
                  <button
                    className={tab === "audit" ? "active" : ""}
                    onClick={showAudit}
                  >
                    Execution & audit
                  </button>
                </div>
                {tab === "findings" && (
                  <>
                    <div className="ciq-review-grid">
                      <section className="ciq-source">
                        <header>
                          <FileText size={16} /> SOURCE AGREEMENT{" "}
                          <span>Text view</span>
                        </header>
                        <pre>
                          {finding ? (
                            <>
                              {sourceChars.slice(0, finding.start).join("")}
                              <mark ref={evidence}>
                                {sourceChars
                                  .slice(finding.start, finding.end)
                                  .join("")}
                              </mark>
                              {sourceChars.slice(finding.end).join("")}
                            </>
                          ) : (
                            review.text
                          )}
                        </pre>
                      </section>
                      <section className="ciq-findings">
                        <div className="ciq-findings-header">
                          <h2>What needs your attention</h2>
                          <span>Commercial playbook deviations</span>
                        </div>
                        <div className="ciq-finding-list">
                          {review.findings.map((f, i) => (
                            <button
                              key={f.id}
                              className={selected === i ? "selected" : ""}
                              onClick={() => setSelected(i)}
                            >
                              <span className={`ciq-severity ${f.severity}`}>
                                {f.severity}
                              </span>
                              <strong>{f.title}</strong>
                              <span className="ciq-finding-meta">
                                {f.rule} · Source line {f.line}
                                <ChevronRight size={14} />
                              </span>
                            </button>
                          ))}
                        </div>
                        {finding ? (
                          <div className="ciq-finding-detail">
                            <div className="ciq-overline">WHY IT MATTERS</div>
                            <p>{finding.rationale}</p>
                            <div className="ciq-proposal">
                              <div className="ciq-overline">
                                <Sparkles size={13} /> PROPOSED NEGOTIATION
                                LANGUAGE
                              </div>
                              <p>{finding.proposed_language}</p>
                              <small>
                                Draft suggestion · Requires legal review
                              </small>
                            </div>
                          </div>
                        ) : (
                          <p className="ciq-empty">
                            No deviations were returned. This is not assurance
                            that the contract is safe.
                          </p>
                        )}
                      </section>
                    </div>
                    {review.missing_topics.length > 0 && (
                      <div className="ciq-warning">
                        Not found in the reviewed text:{" "}
                        {review.missing_topics.join(", ")}. These gaps require
                        human review.
                      </div>
                    )}
                    <section className="ciq-decision">
                      <div>
                        <ShieldCheck size={22} />
                        <h3>Your judgment is the final step.</h3>
                        <p>
                          Recording approval does not sign the agreement or send
                          changes to external systems.
                        </p>
                      </div>
                      {review.status === "awaiting_review" ? (
                        <div>
                          <label htmlFor="decision-reason">
                            Decision rationale (at least 10 characters)
                          </label>
                          <textarea
                            id="decision-reason"
                            value={reason}
                            maxLength={2000}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain the decision, required changes, or accepted exceptions…"
                          />
                          <div>
                            <button
                              className="ciq-button"
                              onClick={() => decide("rejected")}
                              disabled={reason.trim().length < 10 || !!busy}
                            >
                              Request changes
                            </button>
                            <button
                              className="ciq-button ciq-dark"
                              onClick={() => decide("approved")}
                              disabled={reason.trim().length < 10 || !!busy}
                            >
                              Approve review <Check size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ciq-recorded">
                          <CheckCircle2 />
                          <strong>
                            Decision recorded:{" "}
                            {review.status === "rejected"
                              ? "changes requested"
                              : "approved"}
                          </strong>
                          <p>{review.decision_reason}</p>
                          <button className="ciq-link" onClick={showAudit}>
                            Inspect audit record <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </section>
                  </>
                )}
                {tab === "playbook" && (
                  <section className="ciq-panel">
                    <h2>The rules behind this review</h2>
                    <p>
                      These are editable-in-code commercial preferences for the
                      customer, not jurisdiction-specific legal requirements.
                    </p>
                    <pre>{config?.playbook}</pre>
                  </section>
                )}
                {tab === "audit" && (
                  <section className="ciq-panel">
                    <h2>Inspect the review trail</h2>
                    <div className="ciq-trace">
                      {review.trace.map((t, i) => (
                        <div key={t}>
                          <span>{i + 1}</span>
                          {t}
                          <CheckCircle2 size={16} />
                        </div>
                      ))}
                    </div>
                    {audit ? (
                      <>
                        <div className="ciq-audit-state">
                          <ShieldCheck />
                          {audit.valid
                            ? "Audit chain verified"
                            : "Audit chain verification failed"}
                        </div>
                        <p>
                          {audit.scope} A database administrator could rewrite
                          the entire chain; no external anchor is configured.
                        </p>
                        {audit.events.map((e) => (
                          <div className="ciq-event" key={e.hash}>
                            <strong>{e.action.replaceAll("_", " ")}</strong>
                            <time>
                              {new Date(e.timestamp * 1000).toLocaleString()}
                            </time>
                            <code>{e.hash}</code>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p>Loading audit…</p>
                    )}
                  </section>
                )}
              </>
            )}
          </section>
        </main>
      )}
      {busy && (
        <div className="ciq-progress" role="status">
          <Loader2 className="ciq-spin" size={18} />
          {busy}…
        </div>
      )}
      <button
        className="ciq-chat-launch"
        aria-label="Toggle ContractIQ assistant"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? (
          <X size={20} />
        ) : (
          <>
            <MessageSquare size={19} />
            <span>Ask ContractIQ</span>
          </>
        )}
      </button>
      {chatOpen && (
        <section className="ciq-chat">
          <header>
            <div>
              <Sparkles size={17} />
              <strong>
                {review ? "Evidence assistant" : "Meet ContractIQ"}
              </strong>
            </div>
            <span>
              {review?.mode === "sample" || !config?.live_enabled
                ? "Guided sample · no model call"
                : "AI assistant"}
            </span>
          </header>
          <p>
            {review
              ? "Ask about the verified findings in this agreement."
              : "Ask about the workflow, pricing, or how your data is handled."}
          </p>
          <div className="ciq-chat-answer" aria-live="polite">
            {chatBusy
              ? "Preparing an answer…"
              : answer ||
                "Try “What are the biggest risks?” in a sample review, or ask “How does pricing work?” here."}
            {chatMode && (
              <small>
                {chatMode === "live"
                  ? "AI-generated · verify before relying"
                  : chatMode === "error"
                    ? "Request failed"
                    : "Guided response · no model call"}
              </small>
            )}
            {citations.map((id) => (
              <button
                key={id}
                onClick={() => {
                  const i = review!.findings.findIndex((f) => f.id === id);
                  if (i >= 0) {
                    setSelected(i);
                    setTab("findings");
                  }
                }}
              >
                {id} · View source
              </button>
            ))}
          </div>
          <form onSubmit={ask}>
            <input
              aria-label="Ask a question"
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question…"
            />
            <button
              aria-label="Send question"
              disabled={chatBusy || question.trim().length < 3}
            >
              <ArrowRight size={19} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
