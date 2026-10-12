import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContractAssistant, CoverageSummary } from "../../src/features/review/ContractAssistant";

const review = { id: "r", title: "Supplier terms", model: "test-model", mode: "live" };
it("restores conversation and opens the exact cited passage", async () => {
  const request = vi.fn().mockResolvedValue([{ question: "When do I pay?", response: {
    answer: "Within 45 days.", mode: "live", status: "supported",
    claims: [{ text: "Within 45 days.", source_ids: ["S1"] }],
    sources: [{ id: "S1", title: "Supplier terms", quote: "Invoices are due in 45 days.", line: 8, version: "current" }]
  } }]);
  render(<ContractAssistant review={review} token="private" request={request} close={() => {}} />);
  expect(await screen.findByText("When do I pay?")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "S1 · Current · line 8" }));
  expect(screen.getByRole("region", { name: "Cited source passage" })).toHaveTextContent("Invoices are due in 45 days.");
  expect(request).toHaveBeenCalledWith("/contracts/r/conversation", "private");
});
it("keeps the question after failure and lets the user retry", async () => {
  const request = vi.fn().mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("Provider unavailable"))
    .mockResolvedValueOnce({ answer: "No evidence found.", mode: "live", status: "insufficient_evidence", claims: [], sources: [] });
  render(<ContractAssistant review={review} token="private" request={request} close={() => {}} />);
  await screen.findByText("What should I negotiate first?");
  fireEvent.change(screen.getByLabelText("Ask a question"), { target: { value: "Which tribunal applies?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Provider unavailable");
  expect(screen.getByLabelText("Ask a question")).toHaveValue("Which tribunal applies?");
  await waitFor(() => expect(screen.getByRole("button", { name: "Send question" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(await screen.findByText("Not enough evidence")).toBeVisible();
  expect(screen.queryByText(/Current · line/)).not.toBeInTheDocument();
});
describe("coverage", () => {
  it("distinguishes missing from uncertain and handles old reviews", () => {
    const { rerender } = render(<CoverageSummary coverage={[
      { rule: "P1", label: "Liability", status: "missing", reason: "No clause found" },
      { rule: "P3", label: "Renewal", status: "uncertain", reason: "Conflicting terms" },
    ]} />);
    expect(screen.getByText("Not found")).toBeVisible();
    expect(screen.getByText("Needs review")).toBeVisible();
    rerender(<CoverageSummary />);
    expect(screen.getByText(/Detailed coverage is unavailable/)).toBeVisible();
  });
});
