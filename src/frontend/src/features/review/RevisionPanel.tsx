import React, { useState } from "react";
import { ArrowRight, GitCompareArrows } from "lucide-react";

export type Comparison = {
  baseline_id: string;
  baseline_title: string;
  notice: string;
  counts: Record<string, number>;
  changes: {
    rule: string;
    state: string;
    before: { quote: string; line: number; title: string }[];
    after: { quote: string; line: number; title: string }[];
  }[];
};
const labels: Record<string, string> = {
  remains: "Still flagged",
  newly_flagged: "Newly flagged",
  no_longer_flagged: "No longer flagged",
  needs_verification: "Coverage uncertain",
};
const topics: Record<string, string> = {
  P1: "Liability",
  P2: "Indemnification",
  P3: "Renewal",
  P4: "Termination",
  P5: "Data handling",
};

export function RevisionPanel({
  demo,
  sample,
  busy,
  comparison,
  source,
  onCompare,
  onOpenBaseline,
}: {
  demo: boolean;
  sample: string;
  busy: boolean;
  comparison?: Comparison;
  source: string;
  onCompare: (text: string) => void;
  onOpenBaseline: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <section className="revision-panel">
      <div className="revision-heading">
        <GitCompareArrows size={24} />
        <div>
          <h2>Did the negotiation move you forward?</h2>
          <p>
            Review a revised draft against this agreement. Each version keeps
            its own evidence and human decision.
          </p>
        </div>
      </div>
      {comparison && (
        <div className="revision-results">
          <div className="revision-baseline">
            <span>Compared with {comparison.baseline_title}</span>
            <button
              className="ciq-link"
              onClick={() => onOpenBaseline(comparison.baseline_id)}
            >
              Open baseline <ArrowRight size={14} />
            </button>
          </div>
          <div className="revision-counts">
            {Object.entries(labels).map(([state, label]) => (
              <div key={state}>
                <strong>{comparison.counts[state] || 0}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="revision-notice">{comparison.notice}</p>
          {comparison.changes.map((change) => (
            <article className="revision-change" key={change.rule}>
              <header>
                <h3>
                  {change.rule} · {topics[change.rule]}
                </h3>
                <span>{labels[change.state]}</span>
              </header>
              <div className="revision-evidence">
                {(["before", "after"] as const).map((side) => (
                  <section key={side}>
                    <h4>
                      {side === "before"
                        ? "Baseline evidence"
                        : "Revised evidence"}
                    </h4>
                    {change[side].length ? (
                      change[side].map((finding, i) => (
                        <blockquote key={i}>
                          <p>{finding.quote}</p>
                          <small>
                            Source line {finding.line} · {finding.title}
                          </small>
                        </blockquote>
                      ))
                    ) : (
                      <p>
                        No finding returned for this rule. Inspect the revised
                        agreement below; absence is not confirmation that a
                        clause is acceptable.
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ))}
          <details className="revision-source">
            <summary>Inspect complete revised agreement</summary>
            <pre>{source}</pre>
          </details>
        </div>
      )}
      <div className="revision-input">
        <h3>
          {comparison
            ? "Review another revision"
            : "Bring the supplier’s revised draft"}
        </h3>
        {demo ? (
          <>
            <p>
              This curated revision changes liability, renewal, and data
              handling. Two rules remain flagged. No model call is made.
            </p>
            <button
              className="ciq-button ciq-dark"
              disabled={busy || !sample}
              onClick={() => onCompare(sample)}
            >
              Compare sample revision <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <p>
              Revised text is sent to the configured model provider. Comparison
              does not approve either version.
            </p>
            <label htmlFor="revision-text">Revised agreement text</label>
            <textarea
              id="revision-text"
              rows={10}
              value={draft}
              maxLength={60000}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste the complete revised agreement…"
            />
            <button
              className="ciq-button ciq-dark"
              disabled={busy || draft.trim().length < 50}
              onClick={() => onCompare(draft)}
            >
              Analyze and compare revision <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
