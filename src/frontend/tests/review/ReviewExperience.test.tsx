import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReviewExperience from "../../src/features/review/ReviewExperience";

const quote = "Customer liability is unlimited, including indirect damages.";
const source = `Vendor 🏢\n${quote}\nSupplier may terminate on seven days' notice.`;
const finding = {
  id: "F1",
  title: "Unlimited customer liability",
  severity: "critical",
  rule: "P1",
  quote,
  rationale: "The customer bears unlimited exposure.",
  proposed_language: "Cap aggregate liability at twelve months of fees.",
  start: Array.from("Vendor 🏢\n").length,
  end: Array.from("Vendor 🏢\n" + quote).length,
  line: 2,
};
const review = {
  id: "review-1",
  title: "Test supplier agreement",
  text: source,
  status: "awaiting_review",
  findings: [finding],
  missing_topics: [],
  mode: "sample",
  model: "Curated sample — no model call",
  elapsed_ms: 1,
  trace: ["Source received", "1 source citation verified"],
};
let requests: {
  path: string;
  body?: Record<string, unknown>;
  authorization: string | undefined;
}[];
let rejectDecision: boolean;

beforeEach(() => {
  requests = [];
  rejectDecision = false;
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const path = String(input).replace("/api/review", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      const authorization = (
        init?.headers as Record<string, string> | undefined
      )?.Authorization;
      requests.push({ path, body, authorization });
      let data: unknown;
      let status = 200;
      if (path === "/config")
        data = {
          sample: source,
          playbook: "P1: Cap liability at twelve months of fees.",
          google_client_id: "",
          live_enabled: false,
        };
      else if (path === "/auth/demo")
        data = {
          token: "isolated-session",
          name: "Demo workspace",
          demo: true,
        };
      else if (path === "/contracts" && init?.method === "POST") data = review;
      else if (path === "/contracts")
        data = [{ id: review.id, title: review.title, status: review.status }];
      else if (path.endsWith("/decision")) {
        status = rejectDecision ? 409 : 200;
        data = rejectDecision
          ? { detail: "This review already has a decision." }
          : { ...review, status: body.decision, decision_reason: body.reason };
      } else if (path.endsWith("/audit"))
        data = {
          valid: true,
          scope: "Local hash-chain consistency.",
          events: [
            { action: "review_created", timestamp: 1000, hash: "sample-hash" },
          ],
        };
      else if (path.endsWith("/ask"))
        data = {
          answer: "The cited clause leaves liability uncapped.",
          citations: ["F1"],
          mode: "sample",
        };
      else if (path === "/auth/logout") data = { status: "signed_out" };
      else throw new Error("Unexpected API call " + path);
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});

async function openSample() {
  render(<ReviewExperience />);
  const button = screen.getByRole("button", {
    name: "Review a sample agreement",
  });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByRole("heading", { name: review.title });
}

describe("Evidence-first review experience", () => {
  it("labels the sample honestly and preserves citation highlighting after emoji", async () => {
    await openSample();
    expect(screen.getByText("SAMPLE MODE")).toBeVisible();
    expect(screen.getByText(/Curated sample — no model call/)).toBeVisible();
    expect(document.querySelector(".ciq-source mark")?.textContent).toBe(quote);
    expect(
      requests.find((r) => r.path === "/contracts" && r.body)?.authorization,
    ).toBe("Bearer isolated-session");
    expect(
      requests.find((r) => r.path === "/contracts" && r.body)?.body?.text,
    ).toBe(source);
  });
  it("requires a reason before recording a human decision and removes controls afterward", async () => {
    await openSample();
    expect(
      screen.getByRole("button", { name: "Approve review" }),
    ).toBeDisabled();
    fireEvent.change(
      screen.getByLabelText("Decision rationale (at least 10 characters)"),
      { target: { value: "Request a mutual indemnity and a liability cap." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    await screen.findByText("Decision recorded: changes requested");
    expect(
      screen.queryByRole("button", { name: "Approve review" }),
    ).not.toBeInTheDocument();
    expect(
      requests.find((r) => r.path.endsWith("/decision"))?.body?.decision,
    ).toBe("rejected");
  });
  it("surfaces rejected decisions without presenting them as accepted", async () => {
    rejectDecision = true;
    await openSample();
    fireEvent.change(
      screen.getByLabelText("Decision rationale (at least 10 characters)"),
      { target: { value: "All negotiated changes are accepted." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "already has a decision",
    );
    expect(screen.queryByText(/Decision recorded:/)).not.toBeInTheDocument();
  });
  it("connects assistant citations to the source and distinguishes guided answers", async () => {
    await openSample();
    fireEvent.click(
      screen.getByRole("button", { name: "Toggle ContractIQ assistant" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Ask a question" }), {
      target: { value: "Why is liability risky?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    await screen.findByText("The cited clause leaves liability uncapped.");
    expect(screen.getByText("Guided response · no model call")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "F1 · View source" }));
    expect(document.querySelector(".ciq-source mark")?.textContent).toBe(quote);
  });
  it("revokes the session and clears contract content on sign-out", async () => {
    await openSample();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("button", { name: "Review a sample agreement" });
    expect(
      screen.queryByRole("heading", { name: review.title }),
    ).not.toBeInTheDocument();
    expect(requests.find((r) => r.path === "/auth/logout")?.authorization).toBe(
      "Bearer isolated-session",
    );
  });
});

it("shows actual workspace counts and opens an agreement from the overview", async () => {
  await openSample();
  fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  expect(
    await screen.findByRole("heading", { name: "Clarity before commitment." }),
  ).toBeVisible();
  expect(screen.getByText("In this workspace · latest 50")).toBeVisible();
  expect(screen.getByText("Decisions recorded")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Return to review" }));
  expect(screen.getByRole("heading", { name: review.title })).toBeVisible();
});

it("filters findings without showing advice for hidden results", async () => {
  await openSample();
  fireEvent.change(screen.getByRole("textbox", { name: "Search findings" }), {
    target: { value: "no-such-clause" },
  });
  expect(await screen.findByText("No matching findings")).toBeVisible();
  expect(screen.queryByText(finding.rationale)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(await screen.findByText(finding.rationale)).toBeVisible();
  expect(document.querySelector(".ciq-source mark")?.textContent).toBe(quote);
});

it("copies the selected proposed language and confirms the action", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  await openSample();
  fireEvent.click(
    screen.getByRole("button", { name: "Copy proposed language" }),
  );
  expect(await screen.findByText("Copied")).toBeVisible();
  expect(writeText).toHaveBeenCalledWith(finding.proposed_language);
});
