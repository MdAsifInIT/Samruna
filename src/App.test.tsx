import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { DEMO_STORAGE_KEY } from "./domain/persistence";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the dashboard-first foundation shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Enterprise Work Intelligence Console/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load scenario/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset seeded demo state/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Select demo scenario/i })).toBeInTheDocument();
    expect(screen.getByText(/Selected scenario/i, { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/Demo path/i, { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/Current stage/i, { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/Work Pattern Clusters/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Deterministic mock/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Local state saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock-only, no external writes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run safe mock execution/i })).toBeDisabled();
  });

  it("recovers from malformed persisted localStorage state", async () => {
    window.localStorage.setItem(DEMO_STORAGE_KEY, "{not-json");

    render(<App />);

    expect(screen.getByRole("heading", { name: /Enterprise Work Intelligence Console/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem(DEMO_STORAGE_KEY)).toContain('"selectedScenarioId":"it-access"');
    });
  });

  it("runs the staged IT access demo path", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Load scenario/i }));

    expect(screen.getByText("Raw traces")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getAllByText("Normalized items")[0]).toBeInTheDocument();
    expect(screen.getByText(/Raw trace to normalized work item/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maya Chen" })).toBeInTheDocument();
    expect(screen.getByText(/standard access/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /IT access request flow/i })).toBeInTheDocument();
    expect(screen.getByText("Manager approval")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Repeated workflows and automation opportunities/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Manager approval delay/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Exception review/i }));
    expect(screen.getByRole("heading", { name: /Exception review/i })).toBeInTheDocument();
    expect(screen.getByText(/Audit relevance/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Finance system access/i }));
    expect(screen.getByRole("heading", { name: /Finance system access/i })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Governance-gated replay before execution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run safe mock execution/i })).toBeDisabled();
    expect(screen.getAllByText("Blocked").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));

    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run safe mock execution/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Run safe mock execution/i }));

    expect(screen.getByRole("heading", { name: /Governance-gated workflow runner/i })).toBeInTheDocument();
    expect(screen.getByText(/mock task IT-2001 created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human-review lane/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Mock execution run/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Execution audit trail/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Export Summary/i }));

    expect((screen.getByRole("textbox", { name: "Run summary JSON" }) as HTMLTextAreaElement).value).toContain(
      "it-access"
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset seeded demo state/i }));

    expect(screen.queryByRole("heading", { name: /Governance-gated workflow runner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /IT access request flow/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Repeated workflows and automation opportunities/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run safe mock execution/i })).toBeDisabled();
  });

  it("blocks mock execution when governance rejects the proposal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Load scenario/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));
    fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

    expect(screen.getAllByText(/Proposal rejected/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run safe mock execution/i })).toBeDisabled();
    expect(screen.getAllByText(/Blocked/i).length).toBeGreaterThan(0);
  });

  it.each([
    {
      scenarioId: "it-access",
      graphTitle: /IT access request flow/i,
      patternLabel: /Standard application access/i,
      workflowHeading: /Access request operations/i
    },
    {
      scenarioId: "procurement-intake",
      graphTitle: /Procurement intake flow/i,
      patternLabel: /Software procurement intake/i,
      workflowHeading: /Procurement operations/i
    }
  ])("generates proposals and inspects details for $scenarioId", ({ scenarioId, graphTitle, patternLabel, workflowHeading }) => {
    render(<App />);

    fireEvent.change(screen.getByRole("combobox", { name: /Select demo scenario/i }), {
      target: { value: scenarioId }
    });
    fireEvent.click(screen.getByRole("button", { name: /Load scenario/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: workflowHeading })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: graphTitle })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Manager approval/i }));
    expect(screen.getByRole("heading", { name: /Manager approval/i })).toBeInTheDocument();
    expect(screen.getByText(/Audit relevance:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: patternLabel }));
    expect(screen.getByRole("heading", { name: patternLabel })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
  });

  it("shows a safe error for malformed import summaries", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: /Import run summary JSON/i }), {
      target: {
        value: '{"exportedAt":'
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Import Summary/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Import failed: the pasted run summary is not valid JSON\./i);
    expect(screen.getByRole("heading", { name: /Enterprise Work Intelligence Console/i })).toBeInTheDocument();
  });
});
