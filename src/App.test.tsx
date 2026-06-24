import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { DEMO_STORAGE_KEY } from "./domain/persistence";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the menu-based command center shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Enterprise Work Intelligence Console/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Command Center" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Observe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Govern" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Execute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset workflow state/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Select workflow/i })).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: /Operational summary/i });

    expect(within(summary).getByText(/Current workflow/i)).toBeInTheDocument();
    expect(within(summary).getByRole("heading", { name: /Access request operations/i })).toBeInTheDocument();
    expect(within(summary).getByText(/Next best action/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Workflow operations console/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Workflow sequence/i })).toBeInTheDocument();
    expect(screen.getByText(/Work Pattern Clusters/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Deterministic simulation/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Local state saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Controlled local environment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/No external writes/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run simulation/i })).toBeDisabled();
  });

  it("renders visible production readiness and trust safety boundaries", () => {
    render(<App />);

    const readiness = screen.getByRole("region", { name: /Production readiness and trust safety/i });

    expect(within(readiness).getByRole("heading", { name: /Trust & Safety boundary/i })).toBeInTheDocument();
    expect(within(readiness).getByText(/not presented as full enterprise production/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/Deterministic simulation mode active/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/Synthetic data only/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/No external writes/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/No browser-side secrets/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/Simulation before execution/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/Approval gate required/i)).toBeInTheDocument();
    expect(within(readiness).getByText(/Audit trail enabled/i)).toBeInTheDocument();
    expect(
      within(readiness).getByText(
        /Backend, DB, Auth\/RBAC, Connectors, Server-side OpenAI, Immutable audit, Tool allowlists\./i
      )
    ).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));

    expect(screen.getByText("Raw traces")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: /IT access request flow/i })).toBeInTheDocument();
    expect(screen.getAllByText("Manager approval").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Repeated workflows and automation opportunities/i })).toBeInTheDocument();
    expect(screen.getByText(/Score drivers/i)).toBeInTheDocument();

    openView("Observe");
    expect(screen.getAllByText("Normalized items")[0]).toBeInTheDocument();
    expect(screen.getByText(/Raw trace to normalized work item/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maya Chen" })).toBeInTheDocument();
    expect(screen.getByText(/standard access/i)).toBeInTheDocument();

    openView("Analyze");
    fireEvent.click(screen.getAllByRole("button", { name: /Exception review/i })[0]);
    expect(screen.getByRole("heading", { name: /Exception review/i })).toBeInTheDocument();
    expect(screen.getByText(/Audit relevance/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Finance system access/i }));
    expect(screen.getByRole("heading", { name: /Finance system access/i })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
    openView("Govern");
    expect(screen.getByRole("heading", { name: /Governance review before execution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run simulation/i })).toBeDisabled();
    expect(screen.getAllByText("Blocked").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Approve/i })[0]);

    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run simulation/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Run simulation/i }));

    expect(screen.getByRole("heading", { name: /Governance-gated workflow runner/i })).toBeInTheDocument();
    expect(screen.getByText(/simulated task IT-2001 created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human-review lane/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Execution audit trail/i })).toBeInTheDocument();

    openView("Review");
    expect(screen.getByText(/Simulated execution run/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Export Summary/i })[0]);

    expect((screen.getByRole("textbox", { name: "Execution summary JSON" }) as HTMLTextAreaElement).value).toContain(
      "it-access"
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset workflow state/i }));

    expect(screen.queryByRole("heading", { name: /Governance-gated workflow runner/i })).not.toBeInTheDocument();
    openView("Analyze");
    expect(screen.queryByRole("heading", { name: /IT access request flow/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Repeated workflows and automation opportunities/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run simulation/i })).toBeDisabled();
  });

  it("blocks simulated execution when governance rejects the proposal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));
    fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

    expect(screen.getAllByText(/Rejected/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run simulation/i })).toBeDisabled();
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

    fireEvent.change(screen.getByRole("combobox", { name: /Select workflow/i }), {
      target: { value: scenarioId }
    });
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: graphTitle })).toBeInTheDocument();

    openView("Command Center");
    expect(screen.getByRole("heading", { name: workflowHeading })).toBeInTheDocument();
    openView("Analyze");
    fireEvent.click(screen.getAllByRole("button", { name: /Manager approval/i })[0]);
    expect(screen.getByRole("heading", { name: /Manager approval/i })).toBeInTheDocument();
    expect(screen.getByText(/Audit relevance:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: patternLabel }));
    expect(screen.getByRole("heading", { name: patternLabel })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
  });

  it("persists proposal history and lets the selected version drive export", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    const versionSelector = screen.getByRole("combobox", { name: /Select proposal version/i }) as HTMLSelectElement;

    expect(versionSelector.value).toContain("-v1");

    fireEvent.click(screen.getByRole("button", { name: /Create Revision/i }));

    expect(versionSelector.value).toContain("-v2");
    expect(screen.getAllByText(/Revision v2 refreshes governance review/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Export Summary/i }));

    const exported = JSON.parse((screen.getByRole("textbox", { name: "Execution summary JSON" }) as HTMLTextAreaElement).value) as {
      state: {
        selectedProposalId: string;
        proposals: Array<{ id: string; version: number; changeSummary?: string; generatedAt?: string }>;
      };
    };

    expect(exported.state.proposals).toHaveLength(2);
    expect(exported.state.selectedProposalId).toBe(exported.state.proposals[1].id);
    expect(exported.state.proposals[1]).toMatchObject({
      version: 2,
      generatedAt: "2026-05-16T10:00:00.000Z"
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(DEMO_STORAGE_KEY)).toContain('"selectedProposalId":"proposal-pattern-standard_access-v2"');
    });
  });

  it("shows a safe error for malformed import summaries", () => {
    render(<App />);

    openView("Review");
    fireEvent.change(screen.getByRole("textbox", { name: /Import execution summary JSON/i }), {
      target: {
        value: '{"exportedAt":'
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Import Summary/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Import failed: the provided execution summary is not valid JSON\./i);
    expect(screen.getByRole("heading", { name: /Enterprise Work Intelligence Console/i })).toBeInTheDocument();
  });
});

function openView(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
