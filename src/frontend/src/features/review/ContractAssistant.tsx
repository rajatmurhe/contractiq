"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, Loader2, X } from "lucide-react";

type Source = {
  id: string;
  title: string;
  quote: string;
  line: number;
  version: string;
};
type Response = {
  answer: string;
  mode: string;
  status?: string;
  limitation?: string;
  draft?: string | null;
  claims?: { text: string; source_ids: string[] }[];
  sources?: Source[];
};
type Turn = { question: string; response: Response; created_at?: number };
export type Coverage = {
  rule: string;
  label: string;
  status: string;
  evidence?: string | null;
  reason: string;
  line?: number;
};
const labels: Record<string, string> = {
  compliant: "Matches playbook",
  deviation: "Deviation found",
  missing: "Not found",
  uncertain: "Needs review",
};
export function CoverageSummary({ coverage }: { coverage?: Coverage[] }) {
  return (
    <section className="ciq-coverage" aria-label="Review coverage">
      <h3>What was checked</h3>
      <p>
        Five commercial preferences. These assessments can be wrong; inspect the
        supporting clauses.
      </p>
      {!coverage?.length ? (
        <p>
          Detailed coverage is unavailable for this older review. Reanalyze the
          agreement to obtain it.
        </p>
      ) : (
        <div className="ciq-coverage-grid">
          {coverage.map((item) => (
            <details key={item.rule}>
              <summary>
                <span>{item.label}</span>
                <strong data-state={item.status}>
                  {labels[item.status] || "Needs review"}
                </strong>
              </summary>
              <p>{item.reason}</p>
              {item.evidence && <blockquote>{item.evidence}</blockquote>}
              {item.line && <small>Source line {item.line}</small>}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

export function ContractAssistant({
  review,
  token,
  request,
  close,
}: {
  review: {
    id: string;
    title: string;
    model: string;
    mode: string;
    created_at?: number;
    playbook_version?: string;
  };
  token: string;
  request: <T>(path: string, token?: string, body?: unknown) => Promise<T>;
  close: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState<Source>();
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    input.current?.focus();
    request<Turn[]>(`/contracts/${review.id}/conversation`, token)
      .then((data) => {
        if (active.current && Array.isArray(data)) setTurns(data);
      })
      .catch(() => {
        if (active.current)
          setError(
            "Saved conversation could not be loaded. You can retry by reopening the assistant.",
          );
      })
      .finally(() => {
        if (active.current) setLoading(false);
      });
    return () => {
      active.current = false;
    };
  }, [review.id, token, request]);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "nearest" });
  }, [turns, busy]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || loading || question.trim().length < 3) return;
    const submitted = question.trim();
    setBusy(true);
    setError("");
    setSource(undefined);
    try {
      const response = await request<Response>(
        `/contracts/${review.id}/ask`,
        token,
        { question: submitted },
      );
      if (!active.current) return;
      setTurns((previous) =>
        [...previous, { question: submitted, response }].slice(-20),
      );
      setQuestion("");
    } catch (e) {
      if (active.current) setError((e as Error).message);
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <aside
      className="ciq-contract-assistant"
      aria-label="Contract assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <header>
        <div>
          <BookOpen size={18} />
          <strong>Ask contractIQ</strong>
        </div>
        <button onClick={close} aria-label="Close assistant">
          <X size={18} />
        </button>
      </header>
      <div className="ciq-assistant-context">
        <strong>{review.title}</strong>
        <small>
          {review.mode === "sample"
            ? "Curated sample · no model call"
            : "Answers from this agreement"}
        </small>
        <details>
          <summary>Review details</summary>
          <p>{review.model}</p>
          <p>{review.playbook_version || "Earlier playbook version"}</p>
          {review.created_at && (
            <p>{new Date(review.created_at * 1000).toLocaleString()}</p>
          )}
          <p>
            Five-topic commercial review. Source citations establish provenance,
            not legal correctness.
          </p>
        </details>
      </div>
      <div
        className="ciq-conversation"
        aria-live="polite"
        aria-busy={busy || loading}
      >
        {loading && <p>Loading conversation…</p>}
        {!loading && !turns.length && (
          <div className="ciq-assistant-starters">
            <p>
              Understand a clause, check an exception, or prepare your next
              negotiation.
            </p>
            {[
              "What should I negotiate first?",
              "Explain the termination clause.",
              "Which topics need further review?",
              "What changed in this revision?",
            ].map((text) => (
              <button
                key={text}
                onClick={() => {
                  setQuestion(text);
                  input.current?.focus();
                }}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        {turns.map((turn, index) => (
          <article className="ciq-conversation-turn" key={index}>
            <p className="ciq-user-question">{turn.question}</p>
            <small>
              {turn.response.mode === "sample"
                ? "Sample source lookup"
                : "AI answer · verify the evidence"}
            </small>
            {turn.response.status === "insufficient_evidence" && (
              <strong className="ciq-assistant-uncertain">
                Not enough evidence
              </strong>
            )}
            {turn.response.claims?.length ? (
              turn.response.claims.map((claim, claimIndex) => (
                <div key={claimIndex}>
                  <p>{claim.text}</p>
                  <div className="ciq-source-links">
                    {claim.source_ids.map((id) => {
                      const match = turn.response.sources?.find(
                        (item) => item.id === id,
                      );
                      return match ? (
                        <button key={id} onClick={() => setSource(match)}>
                          {id} ·{" "}
                          {match.version === "baseline"
                            ? "Baseline"
                            : "Current"}{" "}
                          · line {match.line}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p>{turn.response.answer}</p>
            )}
            {turn.response.limitation &&
              turn.response.limitation !== turn.response.answer && (
                <p className="ciq-assistant-limit">
                  {turn.response.limitation}
                </p>
              )}
            {turn.response.draft && (
              <div className="ciq-assistant-draft">
                <strong>Proposed wording · requires your review</strong>
                <p>{turn.response.draft}</p>
              </div>
            )}
          </article>
        ))}
        {busy && (
          <p role="status">
            <Loader2 size={16} className="ciq-spin" /> Reading relevant
            passages…
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <div ref={bottom} />
      </div>
      {source && (
        <section
          className="ciq-cited-passage"
          aria-label="Cited source passage"
        >
          <button
            onClick={() => setSource(undefined)}
            aria-label="Close source passage"
          >
            <X size={16} />
          </button>
          <strong>{source.title}</strong>
          <small>
            {source.version} · line {source.line} · {source.id}
          </small>
          <blockquote>{source.quote}</blockquote>
        </section>
      )}
      <form onSubmit={send}>
        <label htmlFor="contract-question">Ask about this agreement</label>
        <textarea
          id="contract-question"
          ref={input}
          aria-label="Ask a question"
          value={question}
          maxLength={1000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about the agreement…"
          rows={2}
        />
        <button
          aria-label="Send question"
          disabled={busy || loading || question.trim().length < 3}
        >
          <ArrowUp size={18} />
        </button>
        <small>
          {review.mode === "sample" ? "Sample lookup runs without a model call." : "Relevant passages and your question are sent to the configured AI provider."} Up to 20 turns are saved with this review.
        </small>
      </form>
    </aside>
  );
}
