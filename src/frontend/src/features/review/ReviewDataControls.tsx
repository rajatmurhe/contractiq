"use client";
import React, { useState } from "react";

export function ReviewDataControls({
  id,
  token,
  deleted,
}: {
  id: string;
  token: string;
  deleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/review/contracts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Could not delete the review. Please retry.",
        );
      }
      deleted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="ciq-data-controls">
      <summary>Your data and privacy</summary>
      <p><a href="/privacy/">Privacy policy</a> · <a href="/terms/">Terms and conditions</a></p>
      <p>
        Your agreement and relevant conversation passages are sent to the
        configured model provider when you request AI analysis. Provider
        retention depends on the host’s account settings; contractIQ does not
        promise zero retention.
      </p>
      <p>
        Reviews and up to 20 conversation turns are saved in this workspace.
        Guest access expires after one hour; expiry does not itself delete saved
        records. Export what you need before leaving. The current free hosting
        setup may reset data on deployment; do not use it as your only copy.
      </p>
      <p>
        You can delete this review, its conversation and its local audit record.
        Delete linked revisions before their original. Host backups and provider
        records have separate retention.
      </p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)}>
          Delete this review
        </button>
      ) : (
        <div role="group" aria-label="Confirm review deletion">
          <p>
            <strong>
              This permanently deletes the review and conversation from the
              active database.
            </strong>{" "}
            Download your report first if you need a copy.
          </p>
          <button type="button" disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Permanently delete review"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
