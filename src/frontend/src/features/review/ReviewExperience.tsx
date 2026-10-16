"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Copy,
  SlidersHorizontal,
  ListChecks,
  BookOpen,
  GitBranch,
  CircleHelp,
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
import "./enterprise.css";
import {
  ContractAssistant,
  AssistantBot,
  CoverageSummary,
  type Coverage,
} from "./ContractAssistant";
import { ReviewDataControls } from "./ReviewDataControls";
import { ProductLanding } from "./ProductLanding";
import { RevisionPanel, type Comparison } from "./RevisionPanel";

type Session = { token: string; name: string; demo: boolean; guest?: boolean };
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
  coverage?: Coverage[];
  created_at?: number;
  playbook_version?: string;
  mode: string;
  model: string;
  elapsed_ms: number;
  usage?: {
    input_tokens: number | null;
    output_tokens: number | null;
    estimated_cost_usd: number | null;
  } | null;
  trace: string[];
  decision_reason?: string;
  comparison?: Comparison;
};
type Config = {
  google_client_id: string;
  live_enabled: boolean;
  input_byte_limit?: number;
  sample: string;
  revised_sample?: string;
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
  let response: Response;
  try {
    response = await fetch(`/api/review${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type":
          body instanceof Blob
            ? "application/octet-stream"
            : "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof Blob ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      "Could not reach contractIQ. Check your connection and try again.",
    );
  }
  const data = await response.json().catch(() => null);
  if (response.status === 401 && token)
    window.dispatchEvent(
      new CustomEvent("contractiq-session-expired", { detail: token }),
    );
  if (!response.ok)
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : response.status >= 500
          ? "contractIQ is temporarily unavailable. Please try again shortly."
          : "Request failed. Please check your input and try again.",
    );
  if (data === null)
    throw new Error(
      "The server returned an unreadable response. Please retry.",
    );
  return data;
}

export default function ReviewExperience() {
  const [config, setConfig] = useState<Config>();
  const [configAttempt, setConfigAttempt] = useState(0);
  const [restoring, setRestoring] = useState(true);
  const [session, setSession] = useState<Session>();
  const [review, setReview] = useState<Review>();
  const [history, setHistory] = useState<History[]>([]);
  const [selected, setSelected] = useState(0);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Supplier agreement");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const [reason, setReason] = useState("");
  const [audit, setAudit] = useState<Audit>();
  const [tab, setTab] = useState<
    "findings" | "audit" | "playbook" | "revision"
  >("findings");
  const [clausePrompt, setClausePrompt] = useState<{ text: string; sequence: number; reviewId: string }>();
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMode, setChatMode] = useState("");
  const [overview, setOverview] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [contractSearch, setContractSearch] = useState("");
  const [findingSearch, setFindingSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [sourceFocus, setSourceFocus] = useState(false);
  const [copied, setCopied] = useState(false);
  const decisionRef = useRef<HTMLElement>(null);
  const googleButton = useRef<HTMLDivElement>(null);
  const evidence = useRef<HTMLElement>(null);
  const contextVersion = useRef(0);

  useEffect(() => {
    contextVersion.current += 1;
    setAnswer("");
    setQuestion("");
    setChatMode("");
    setChatBusy(false);
    setAudit(undefined);
  }, [session?.token, review?.id]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("contractiq-session") || "null",
        );
        if (!saved?.token || typeof saved.token !== "string") return;
        const metadata = await api<Omit<Session, "token">>(
          "/auth/session",
          saved.token,
        );
        if (!active) return;
        setSession({ ...metadata, token: saved.token });
        if (saved.reviewId && typeof saved.reviewId === "string") {
          try {
            const prior = await api<Review>(
              `/contracts/${encodeURIComponent(saved.reviewId)}`,
              saved.token,
            );
            if (active) setReview(prior);
          } catch {
            /* A missing review must not prevent opening the workspace. */
          }
        }
      } catch {
        try {
          sessionStorage.removeItem("contractiq-session");
        } catch {
          /* Storage may be disabled. */
        }
      } finally {
        if (active) setRestoring(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (restoring) return;
    try {
      if (session)
        sessionStorage.setItem(
          "contractiq-session",
          JSON.stringify({ token: session.token, reviewId: review?.id }),
        );
      else sessionStorage.removeItem("contractiq-session");
    } catch {
      /* In-memory evaluation still works when browser storage is disabled. */
    }
  }, [session, review?.id, restoring]);
  useEffect(() => {
    const expire = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== session?.token) return;
      setSession(undefined);
      setReview(undefined);
      setHistory([]);
      setAnswer("");
      setAudit(undefined);
      setReason("");
      setText("");
      setChatOpen(false);
      setError(
        "Your session expired. Start a new guest workspace or sign in again.",
      );
    };
    window.addEventListener("contractiq-session-expired", expire);
    return () =>
      window.removeEventListener("contractiq-session-expired", expire);
  }, [session?.token]);
  useEffect(() => {
    let active = true;
    api<Config>("/config")
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [configAttempt]);
  useEffect(() => {
    if (!config?.google_client_id || session || restoring) return;
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
  }, [config?.google_client_id, session, restoring]);
  useEffect(() => {
    let active = true;
    if (session)
      api<History[]>("/contracts", session.token)
        .then((value) => {
          if (active) setHistory(value);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [session, review]);
  useEffect(() => {
    const mark = evidence.current;
    const source = mark?.parentElement;
    if (mark && source) {
      source.scrollTo({
        top:
          source.scrollTop +
          mark.getBoundingClientRect().top -
          source.getBoundingClientRect().top -
          60,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [selected, review?.id]);

  async function startEvaluation() {
    setBusy("Opening your workspace");
    setError("");
    try {
      setSession(await api<Session>("/auth/guest", undefined, {}));
      setReview(undefined);
      setOverview(false);
      setText("");
      setTitle("My contract");
      setUploadInfo("");
      setAnswer("");
      setTab("findings");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function startDemo() {
    setOverview(false);
    setMobileNav(false);
    setFindingSearch("");
    setSeverity("all");
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
    setOverview(false);
    setFindingSearch("");
    setSeverity("all");
    setBusy("Reviewing against your playbook. Longer contracts can take several minutes; keep this page open.");
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
  async function compareRevision(revisedText: string) {
    if (!session || !review) return;
    setBusy("Reviewing the revised agreement");
    setError("");
    try {
      const next = await api<Review>("/contracts", session.token, {
        title: `${review.title.slice(0, 138)} · Revision`,
        text: revisedText,
        baseline_id: review.id,
      });
      setReview(next);
      setSelected(0);
      setFindingSearch("");
      setSeverity("all");
      setReason("");
      setAudit(undefined);
      setAnswer("");
      setTab("revision");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function openBaseline(id: string) {
    if (!session || busy) return;
    setBusy("Opening agreement");
    setError("");
    setOverview(false);
    setMobileNav(false);
    try {
      setReview(await api<Review>(`/contracts/${id}`, session!.token));
      setSelected(0);
      setReason("");
      setAnswer("");
      setAudit(undefined);
      setFindingSearch("");
      setSeverity("all");
      setTab("findings");
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
    if (!review || !session) return;
    const version = contextVersion.current;
    setTab("audit");
    setError("");
    try {
      const result = await api<Audit>(
        `/contracts/${review.id}/audit`,
        session.token,
      );
      if (version === contextVersion.current) setAudit(result);
    } catch (e) {
      if (version === contextVersion.current) setError((e as Error).message);
    }
  }
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (chatBusy || question.trim().length < 3) return;
    const version = contextVersion.current;
    setChatBusy(true);
    setAnswer("");
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
      if (version !== contextVersion.current) return;
      setAnswer(data.answer);
      setChatMode(data.mode);
    } catch (e) {
      if (version === contextVersion.current) {
        setAnswer((e as Error).message);
        setChatMode("error");
      }
    } finally {
      if (version === contextVersion.current) setChatBusy(false);
    }
  }
  async function download(format: "html" | "json") {
    if (!review || !session) return;
    setError("");
    try {
      const bundle = await api<{ html?: string }>(
        `/contracts/${review.id}/${format === "html" ? "report" : "export"}`,
        session.token,
      );
      const url = URL.createObjectURL(
        new Blob(
          [
            format === "html"
              ? bundle.html || ""
              : JSON.stringify(bundle, null, 2),
          ],
          {
            type:
              format === "html"
                ? "text/html;charset=utf-8"
                : "application/json",
          },
        ),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `contractIQ-${review.id}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
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
      setOverview(false);
      setMobileNav(false);
      setSeverity("all");
      setFindingSearch("");
      setSourceFocus(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const finding = review?.findings[selected];
  const visibleFindings =
    review?.findings
      .map((f, index) => ({ ...f, index }))
      .filter(
        (f) =>
          (severity === "all" || f.severity === severity) &&
          `${f.title} ${f.quote} ${f.rule}`
            .toLowerCase()
            .includes(findingSearch.toLowerCase()),
      ) || [];
  useEffect(() => {
    const matches =
      review?.findings
        .map((f, index) => ({ ...f, index }))
        .filter(
          (f) =>
            (severity === "all" || f.severity === severity) &&
            `${f.title} ${f.quote} ${f.rule}`
              .toLowerCase()
              .includes(findingSearch.toLowerCase()),
        ) || [];
    setSelected((current) =>
      matches.some((f) => f.index === current)
        ? current
        : (matches[0]?.index ?? -1),
    );
  }, [review?.id, severity, findingSearch]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNav(false);
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const criticalCount =
    review?.findings.filter((f) => f.severity === "critical").length || 0;
  const highCount =
    review?.findings.filter((f) => f.severity === "high").length || 0;
  function navigateWorkspace(
    destination: "overview" | "findings" | "playbook" | "audit" | "decision",
  ) {
    setMobileNav(false);
    setOverview(destination === "overview");
    if (destination === "audit") void showAudit();
    else if (destination !== "overview")
      setTab(destination === "playbook" ? "playbook" : "findings");
    if (destination === "decision")
      setTimeout(
        () =>
          decisionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0,
      );
  }
  async function copyProposal() {
    try {
      await navigator.clipboard.writeText(finding!.proposed_language);
      setCopied(true);
    } catch {
      setError(
        "Copy is unavailable in this browser. Select and copy the proposed text directly.",
      );
    }
  }
  useEffect(() => {
    setCopied(false);
  }, [selected, review?.id]);
  const sourceChars = useMemo(
    () => Array.from(review?.text || ""),
    [review?.text],
  );
  return (
    <div
      className={`ciq enterprise ${session ? "is-workspace" : "is-landing"}`}
    >
      <header className="ciq-header">
        {session && (
          <button
            className="mobile-nav-toggle"
            aria-label="Open workspace navigation"
            aria-expanded={mobileNav}
            aria-controls="workspace-navigation"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={20} />
          </button>
        )}
        <a href="/" className="ciq-brand">
          <span>
            <Scale size={21} />
          </span>
          contract<span className="ciq-brand-iq">IQ</span>
          <small>CONTRACT INTELLIGENCE</small>
        </a>
        <nav>
          {!session ? (
            <>
              <a href="#workflow">How it works</a>
              <a href="#pricing">Pricing</a>
              <button
                className="ciq-button ciq-dark"
                onClick={startEvaluation}
                disabled={!config || !!busy || restoring}
              >
                Start reviewing <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <>
              <span className="workspace-live-label">
                <span />
                {session.demo
                  ? "Sample workspace"
                  : session.guest
                    ? "Guest workspace"
                    : "Private workspace"}
              </span>
              <span className="user-avatar">{session.name.slice(0, 1)}</span>
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
          {!config && (
            <button
              className="ciq-button"
              onClick={() => {
                setError("");
                setConfigAttempt((n) => n + 1);
              }}
            >
              Retry connection
            </button>
          )}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {!session ? (
        <ProductLanding
          evaluate={startEvaluation}
          liveEnabled={!!config?.live_enabled}
          ready={!!config && !restoring}
          busy={!!busy}
          start={startDemo}
          googleRef={googleButton}
          googleConfigured={!!config?.google_client_id}
        />
      ) : (
        <main className="ciq-workspace">
          {mobileNav && (
            <button
              className="nav-scrim"
              aria-label="Close navigation"
              onClick={() => setMobileNav(false)}
            />
          )}
          <aside
            id="workspace-navigation"
            className={`ciq-sidebar ${mobileNav ? "mobile-open" : ""}`}
          >
            <button
              className="mobile-close-nav"
              aria-label="Close workspace navigation"
              onClick={() => setMobileNav(false)}
            >
              <X size={19} />
            </button>
            <div className="workspace-switch">
              <span className="workspace-monogram">
                {session.demo ? "D" : session.name.slice(0, 1)}
              </span>
              <div>
                <strong>
                  {session.demo
                    ? "Sample workspace"
                    : session.guest
                      ? "Guest workspace"
                      : "My workspace"}
                </strong>
                <small>
                  {session.demo
                    ? "Explore contractIQ"
                    : "Contract intelligence"}
                </small>
              </div>
              <ChevronRight size={14} />
            </div>
            <div className="ciq-overline">WORKSPACE</div>
            <div className="workspace-nav">
              <button
                className={overview ? "active" : ""}
                onClick={() => navigateWorkspace("overview")}
              >
                <LayoutDashboard size={17} />
                Overview
              </button>
              <button
                className={!overview && tab === "findings" ? "active" : ""}
                onClick={() => navigateWorkspace("findings")}
              >
                <FileText size={17} />
                Contract review{review && <span>1</span>}
              </button>
              <button
                disabled={!review}
                onClick={() => navigateWorkspace("decision")}
              >
                <ListChecks size={17} />
                Decisions
                {review?.status === "awaiting_review" && (
                  <span className="nav-count">1</span>
                )}
              </button>
            </div>
            <div className="ciq-overline">INTELLIGENCE</div>
            <div className="workspace-nav">
              <button
                disabled={!review}
                className={!overview && tab === "playbook" ? "active" : ""}
                onClick={() => navigateWorkspace("playbook")}
              >
                <BookOpen size={17} />
                Playbook
              </button>
              <button
                disabled={!review}
                className={!overview && tab === "audit" ? "active" : ""}
                onClick={() => navigateWorkspace("audit")}
              >
                <GitBranch size={17} />
                Review activity
              </button>
              <button onClick={() => setChatOpen(true)}>
                <Sparkles size={17} />
                Evidence assistant
                <ArrowUpRight size={13} />
              </button>
            </div>
            <button
              className="ciq-new"
              disabled={!!busy}
              onClick={() => {
                setOverview(false);
                setMobileNav(false);
                setReview(undefined);
                setText("");
                setTitle("Supplier agreement");
                setUploadInfo("");
                setError("");
                setAudit(undefined);
                setAnswer("");
                setTab("findings");
              }}
            >
              <Plus size={16} /> New review
            </button>
            <div className="ciq-overline">RECENT AGREEMENTS</div>
            <label className="sidebar-search">
              <Search size={14} />
              <input
                aria-label="Search recent agreements"
                placeholder="Find an agreement…"
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
              />
            </label>
            {history
              .filter((h) =>
                h.title.toLowerCase().includes(contractSearch.toLowerCase()),
              )
              .map((h) => (
                <button
                  className={`ciq-history ${h.id === review?.id ? "active" : ""}`}
                  key={h.id}
                  disabled={!!busy}
                  onClick={() => void openBaseline(h.id)}
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
                  ? "Explore sample findings and a revised draft. Sign out to review your own agreement."
                  : session.guest
                    ? "Free one-hour guest workspace. Refresh is supported in this tab. Export before signing out or closing the tab."
                    : "Only your account can access these reviews. Export a copy to keep your work; hosted storage may reset."}
              </p>
            </div>
          </aside>
          <section className="ciq-review-main">
            <div className="ciq-breadcrumb">
              Workspace <ChevronRight size={13} />{" "}
              {overview
                ? "Overview"
                : review
                  ? "Agreement review"
                  : "New review"}{" "}
              <span className="ciq-pill">
                {session.demo
                  ? "SAMPLE MODE"
                  : config?.live_enabled
                    ? "AI CONNECTED"
                    : "AI NOT CONNECTED"}
              </span>
            </div>
            {overview ? (
              <section className="workspace-overview">
                <div className="overview-heading">
                  <div>
                    <span className="product-kicker">
                      YOUR CONTRACT OPERATIONS, AT A GLANCE
                    </span>
                    <h1>Clarity before commitment.</h1>
                    <p>
                      Know what needs attention. Keep every decision grounded in
                      evidence.
                    </p>
                  </div>
                  <button
                    className="ciq-button ciq-dark"
                    onClick={() => {
                      setOverview(false);
                      setReview(undefined);
                    }}
                  >
                    <Plus size={16} />
                    New review
                  </button>
                </div>
                <div className="overview-metrics">
                  <article>
                    <span>
                      <FileText size={18} />
                      Recent agreements
                    </span>
                    <strong>{history.length}</strong>
                    <small>In this workspace · latest 50</small>
                  </article>
                  <article>
                    <span>
                      <ListChecks size={18} />
                      Awaiting a decision
                    </span>
                    <strong>
                      {
                        history.filter((h) => h.status === "awaiting_review")
                          .length
                      }
                    </strong>
                    <small>Reviews ready for human judgment</small>
                  </article>
                  <article>
                    <span>
                      <ShieldCheck size={18} />
                      Decisions recorded
                    </span>
                    <strong>
                      {
                        history.filter((h) => h.status !== "awaiting_review")
                          .length
                      }
                    </strong>
                    <small>Approved or changes requested</small>
                  </article>
                </div>
                <div className="overview-content">
                  <section className="overview-agreements">
                    <header>
                      <div>
                        <h2>Recent agreements</h2>
                        <p>Your reviews and their next steps.</p>
                      </div>
                      <span>{history.length} total</span>
                    </header>
                    {history.length ? (
                      history.map((h) => (
                        <button
                          key={h.id}
                          onClick={async () => {
                            try {
                              setReview(
                                await api<Review>(
                                  `/contracts/${h.id}`,
                                  session.token,
                                ),
                              );
                              setOverview(false);
                              setSelected(0);
                              setReason("");
                              setTab("findings");
                              setAudit(undefined);
                              setFindingSearch("");
                              setSeverity("all");
                              setAnswer("");
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          <span className="agreement-file">
                            <FileText size={20} />
                          </span>
                          <span>
                            <strong>{h.title}</strong>
                            <small>
                              {h.status === "awaiting_review"
                                ? "Ready for your decision"
                                : "Decision recorded"}
                            </small>
                          </span>
                          <span className={`ciq-status ${h.status}`}>
                            {h.status === "rejected"
                              ? "Changes requested"
                              : h.status.replaceAll("_", " ")}
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <div className="overview-empty">
                        <FileText size={30} />
                        <h3>Your first review starts here.</h3>
                        <p>
                          Open the sample or create a review to see agreements
                          in your workspace.
                        </p>
                        <button
                          className="ciq-button"
                          onClick={() => {
                            setOverview(false);
                            setReview(undefined);
                          }}
                        >
                          Create a review
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </section>
                  <aside className="overview-guide">
                    <span className="guide-icon">
                      <Sparkles size={23} />
                    </span>
                    <span className="product-kicker">
                      A BETTER REVIEW HABIT
                    </span>
                    <h3>
                      Read. Challenge.
                      <br />
                      Decide.
                    </h3>
                    <p>
                      Start with critical findings. Inspect the quoted clause,
                      compare the proposed language, then document your
                      decision.
                    </p>
                    <button
                      className="ciq-button"
                      onClick={() => {
                        setOverview(false);
                        setTab("findings");
                      }}
                    >
                      Return to review
                      <ArrowRight size={15} />
                    </button>
                    <div>
                      <ShieldCheck size={16} />
                      AI supports your judgment.
                      <br />
                      It never signs the agreement.
                    </div>
                  </aside>
                </div>
              </section>
            ) : !review ? (
              <div className="ciq-upload">
                <div className="ciq-overline">
                  EVERY GOOD DECISION STARTS WITH THE SOURCE
                </div>
                <h1>{session.demo ? "Explore a sample contract" : "Review your contract"}</h1>
                <p>
                  {session.demo
                    ? "Explore a synthetic supplier agreement with five curated deviations."
                    : "Upload your agreement to find terms that may need attention, with explanations and quotes from your document."}
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
                    <ol className="ciq-upload-steps" aria-label="How to review your contract">
                      <li><b>1</b> Add your contract</li>
                      <li><b>2</b> Check the text</li>
                      <li><b>3</b> Get your review</li>
                    </ol>
                      <label className="ciq-button ciq-file ciq-upload-picker">
                        <strong>Choose a contract file</strong>
                        <span>PDF, Word (.docx), or TXT · up to 5 MB</span>
                        <input
                          type="file"
                          aria-label="Upload your contract"
                          disabled={!!busy}
                          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            e.target.value = "";
                            setError("");
                            setUploadInfo("");
                            if (f.size > 5 * 1024 * 1024) {
                              setError("Choose a file up to 5 MB.");
                              return;
                            }
                            setBusy("Reading your contract");
                            try {
                              const result = await api<{
                                text: string;
                                format: string;
                              }>(
                                `/documents/extract?filename=${encodeURIComponent(f.name)}`,
                                session.token,
                                f,
                              );
                              setText(result.text);
                              setTitle(
                                f.name.replace(/\.[^.]+$/, "").slice(0, 150),
                              );
                              setUploadInfo(
                                `${f.name} imported. Check the text for missing content, table order, and formatting before analysis. No AI review has run yet.`,
                              );
                            } catch (err) {
                              setError((err as Error).message);
                            } finally {
                              setBusy("");
                            }
                          }}
                        />
                      </label>
                    <p className="ciq-upload-hint">Choose a file above, or paste your contract below. You can edit the text before starting the review.</p>
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
                        rows={7}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={60000}
                        placeholder="Paste your contract here, or choose a file above to fill this in automatically."
                      />
                    </label>
                    <div className="ciq-upload-actions">

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
                    {config?.input_byte_limit &&
                      config.input_byte_limit < 240000 && (
                        <p>
                          This workspace accepts up to{" "}
                          {config.input_byte_limit.toLocaleString()} UTF-8 bytes
                          per review. Larger contracts need a model with a
                          larger document limit.
                        </p>
                      )}
                    {uploadInfo && <p role="status">{uploadInfo}</p>}
                    {!busy && text.trim().length < 50 && <p className="ciq-upload-hint">Add at least 50 characters of contract text to enable analysis.</p>}
                    <p>When you select Analyze agreement, your text is sent to the AI provider. The review checks liability, indemnity, renewal, termination, and data handling.</p>
                    <p>
                      PDF, DOCX, TXT · up to 5 MB and 60,000 extracted
                      characters. Scanned PDFs need OCR first.
                    </p>
                    <button
                      className="ciq-link"
                      onClick={startDemo}
                      disabled={!!busy}
                    >
                      Try the sample walkthrough instead
                    </button>
                    {!config?.live_enabled && (
                      <p>
                        You can import and inspect your contract now. AI
                        analysis is temporarily unavailable. Please try again
                        later. Your text has not been analyzed.
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
                      {review.mode === "sample" ? "SAMPLE REVIEW" : "AI REVIEW"}
                    </div>
                    <h1>{review.title}</h1>
                    <p>
                      {review.findings.length} verified citations <span>·</span>{" "}
                      {review.model}
                    </p>
                  </div>
                  <div className="review-export-actions">
                    <button
                      className="ciq-button"
                      onClick={() => download("html")}
                    >
                      <Download size={15} /> Download report
                    </button>
                    <button
                      className="ciq-button ciq-plain"
                      onClick={() => download("json")}
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
                <div className="review-summary">
                  <div>
                    <span className="summary-icon risk">
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <strong>{criticalCount}</strong>
                      <span>Critical findings</span>
                    </div>
                  </div>
                  <div>
                    <span className="summary-icon warning">
                      <SlidersHorizontal size={20} />
                    </span>
                    <div>
                      <strong>{highCount}</strong>
                      <span>High priority</span>
                    </div>
                  </div>
                  <div>
                    <span className="summary-icon verified">
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <strong>{review.findings.length}</strong>
                      <span>Verified citations</span>
                    </div>
                  </div>
                  <button onClick={() => navigateWorkspace("decision")}>
                    <ListChecks size={19} />
                    <span>
                      {review.status === "awaiting_review"
                        ? "Ready for your decision"
                        : "View recorded decision"}
                      <small>
                        {review.status === "awaiting_review"
                          ? "Review findings before approving"
                          : "A reasoned decision is on record"}
                      </small>
                    </span>
                    <ArrowRight size={18} />
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
                  <button
                    className={tab === "revision" ? "active" : ""}
                    onClick={() => setTab("revision")}
                  >
                    Compare revision
                  </button>
                </div>
                {tab === "findings" && (
                  <>
                    <div
                      className={`ciq-review-grid ${sourceFocus ? "source-focused" : ""}`}
                    >
                      <section className="ciq-source">
                        <header>
                          <FileText size={16} /> SOURCE AGREEMENT{" "}
                          <span>TEXT VIEW</span>
                          <button
                            className="source-focus-button"
                            aria-label={
                              sourceFocus
                                ? "Restore split view"
                                : "Expand source document"
                            }
                            onClick={() => setSourceFocus(!sourceFocus)}
                          >
                            {sourceFocus ? (
                              <PanelLeftClose size={16} />
                            ) : (
                              <PanelLeftOpen size={16} />
                            )}
                          </button>
                        </header>
                        <div className="document-label">
                          <span>AGREEMENT / ORIGINAL TEXT</span>
                          <span>
                            {finding ? `Line ${finding.line}` : "Source"}
                          </span>
                        </div>
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
                        <div className="finding-controls">
                          <label>
                            <Search size={15} />
                            <input
                              aria-label="Search findings"
                              placeholder="Search findings or clauses…"
                              value={findingSearch}
                              onChange={(e) => setFindingSearch(e.target.value)}
                            />
                          </label>
                          <div
                            className="severity-filters"
                            aria-label="Filter findings by severity"
                          >
                            {["all", "critical", "high", "medium"].map(
                              (level) => (
                                <button
                                  key={level}
                                  aria-pressed={severity === level}
                                  className={severity === level ? "active" : ""}
                                  onClick={() => {
                                    setSeverity(level);
                                    const next = review.findings.findIndex(
                                      (f) =>
                                        level === "all" || f.severity === level,
                                    );
                                    if (next >= 0) setSelected(next);
                                  }}
                                >
                                  {level === "all" ? "All findings" : level}
                                  <span>
                                    {level === "all"
                                      ? review.findings.length
                                      : review.findings.filter(
                                          (f) => f.severity === level,
                                        ).length}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="ciq-finding-list">
                          {visibleFindings.length === 0 && (
                            <div className="findings-empty">
                              <Search size={22} />
                              <strong>No matching findings</strong>
                              <span>Try another phrase or severity.</span>
                              <button
                                onClick={() => {
                                  setFindingSearch("");
                                  setSeverity("all");
                                }}
                              >
                                Clear filters
                              </button>
                            </div>
                          )}
                          {visibleFindings.map((f) => (
                            <button
                              key={f.id}
                              className={selected === f.index ? "selected" : ""}
                              aria-pressed={selected === f.index}
                              onClick={() => setSelected(f.index)}
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
                            <button className="ciq-explain-clause" onClick={() => {
                              setClausePrompt({ text: `Explain this clause in simple language. What does it mean for me, and what exceptions should I check?\n\nClause: ${finding.quote}`, sequence: Date.now(), reviewId: review.id });
                              setChatOpen(true);
                            }}><AssistantBot /> Explain this clause</button>
                            <div className="ciq-overline">WHY IT MATTERS</div>
                            <p>{finding.rationale}</p>
                            <div className="ciq-proposal">
                              <div className="ciq-overline">
                                <Sparkles size={13} /> PROPOSED NEGOTIATION
                                LANGUAGE
                              </div>
                              <p>{finding.proposed_language}</p>
                              <div className="proposal-footer">
                                <small>Draft · Requires legal review</small>
                                <button
                                  onClick={copyProposal}
                                  aria-label="Copy proposed language"
                                >
                                  {copied ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                  <span aria-live="polite">
                                    {copied ? "Copied" : "Copy language"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="ciq-empty">
                            No finding is selected. Clear your filters or select
                            a finding to inspect its evidence. A review without
                            findings does not establish safety.
                          </p>
                        )}
                      </section>
                    </div>
                    <CoverageSummary coverage={review.coverage} />
                    {session && (
                      <ReviewDataControls
                        id={review.id}
                        token={session.token}
                        deleted={() => {
                          setHistory((items) =>
                            items.filter((item) => item.id !== review.id),
                          );
                          setReview(undefined);
                          setText("");
                          setChatOpen(false);
                        }}
                      />
                    )}
                    {review.missing_topics.length > 0 && (
                      <div className="ciq-warning">
                        Not found in the reviewed text:{" "}
                        {review.missing_topics.join(", ")}. These gaps require
                        human review.
                      </div>
                    )}
                    <section className="ciq-decision" ref={decisionRef}>
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
                {tab === "revision" && (
                  <RevisionPanel
                    onExtract={async (file) => {
                      const result = await api<{ text: string }>(
                        `/documents/extract?filename=${encodeURIComponent(file.name)}`,
                        session.token,
                        file,
                      );
                      return result.text;
                    }}
                    key={review.id}
                    demo={session.demo}
                    sample={config?.revised_sample || ""}
                    busy={!!busy}
                    comparison={review.comparison}
                    source={review.text}
                    onCompare={compareRevision}
                    onOpenBaseline={openBaseline}
                  />
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
                    <div className="review-run-metrics">
                      <div>
                        <strong>{review.elapsed_ms.toLocaleString()} ms</strong>
                        <span>
                          {review.mode === "sample"
                            ? "Sample processing · no inference"
                            : "Model review and validation"}
                        </span>
                      </div>
                      <div>
                        <strong>
                          {review.usage?.input_tokens == null
                            ? "Unavailable"
                            : review.usage.input_tokens.toLocaleString()}{" "}
                          /{" "}
                          {review.usage?.output_tokens == null
                            ? "Unavailable"
                            : review.usage.output_tokens.toLocaleString()}
                        </strong>
                        <span>Input / output tokens</span>
                      </div>
                      <div>
                        <strong>
                          {review.mode === "sample"
                            ? "No model call"
                            : review.usage?.estimated_cost_usd == null
                              ? "Unknown"
                              : `$${review.usage.estimated_cost_usd.toFixed(5)}`}
                        </strong>
                        <span>Estimated model cost · excludes hosting</span>
                      </div>
                    </div>
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
      {chatOpen && review && session && (
        <ContractAssistant
          key={review.id + session.token}
          review={review}
          token={session.token}
          request={api}
          prompt={clausePrompt?.reviewId === review.id ? clausePrompt : undefined}
          close={() => setChatOpen(false)}
        />
      )}
      <button
        className={`ciq-chat-launch ${chatOpen ? "" : "ciq-pet-launch"}`}
        aria-expanded={chatOpen}
        aria-label="Toggle contractIQ assistant"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? (
          <X size={20} />
        ) : (
          <>
            <AssistantBot />
            <span>Ask contractIQ</span>
          </>
        )}
      </button>
      {chatOpen && !review && (
        <section className="ciq-chat">
          <header>
            <div>
              <Sparkles size={17} />
              <strong>
                {review ? "Evidence assistant" : "Meet contractIQ"}
              </strong>
            </div>
            <span>
              {!config?.live_enabled
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
