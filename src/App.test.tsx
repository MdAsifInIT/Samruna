import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { createSeedDemoState, DEMO_STORAGE_KEY, saveDemoState } from "./domain/persistence";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState(null, "", "/");
  });

  it("renders the customer-facing landing page first", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Work Graph Foundry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Launch" })).toHaveLength(1);
    expect(screen.getByLabelText("Work Graph Foundry product preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Connected automation path")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Landing workflow blocks" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Impact evidence" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Overview" })).not.toBeInTheDocument();
  });

  it("opens the hash-backed five-view workspace", async () => {
    render(<App />);
    await launchDemo();

    expect(window.location.hash).toBe("#demo");
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access request operations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Graph" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review & Run" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load workflow/i })).toBeInTheDocument();
    expect(screen.getByLabelText("System status")).toHaveTextContent("AI provider");
    expect(screen.getByLabelText("System status")).toHaveTextContent("Validation engine");

    const summary = screen.getByRole("region", { name: /Operational summary/i });

    expect(within(summary).getByRole("heading", { name: /Access request operations/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Impact comparison")).toBeInTheDocument();
    expect(screen.getByText("System details")).toBeInTheDocument();
  });

  it("shows backend fallback recovery controls when the API is unavailable", async () => {
    render(<App />);
    await launchDemo();

    await waitFor(() => {
      expect(screen.getAllByText(/browser fallback mirror/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole("button", { name: /Retry backend/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset workflow/i })).toBeInTheDocument();
  });

  it("shows sanitized provider fallback metadata from the browser mirror", async () => {
    const fallbackState = createSeedDemoState();
    fallbackState.aiProvider = {
      mode: "openai",
      label: "OpenAI Responses API",
      available: true,
      model: "gpt-test",
      lastInvocation: {
        providerMode: "openai",
        providerLabel: "OpenAI Responses API",
        model: "gpt-test",
        status: "fallback",
        validationStatus: "failed",
        requestedAt: "2026-05-16T09:40:00Z",
        completedAt: "2026-05-16T09:40:04Z",
        fallbackReason: "Validation engine proposal used after provider failure.",
        errorCode: "provider_error"
      }
    };
    saveDemoState(fallbackState);

    render(<App />);
    await launchDemo();

    expect(screen.getByLabelText("System status")).toHaveTextContent("Fallback used");
    expect(screen.getAllByText(/Reason code: provider_error/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/OPENAI_API_KEY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
  });

  it("recovers from malformed persisted localStorage state", async () => {
    window.localStorage.setItem(DEMO_STORAGE_KEY, "{not-json");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Work Graph Foundry" })).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem(DEMO_STORAGE_KEY)).toContain('"selectedScenarioId":"it-access"');
    });
  });

  it("runs the staged IT access demo path", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));

    expect(screen.getByText("Raw traces")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: /IT access request flow/i })).toBeInTheDocument();
    expect(screen.getAllByText("Manager approval").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Repeated workflow and bottleneck" })).toBeInTheDocument();
    expect(screen.getByText(/Score drivers/i)).toBeInTheDocument();

    openView("Evidence");
    expect(screen.getAllByText("Normalized items")[0]).toBeInTheDocument();
    expect(screen.getByText(/Raw trace to normalized work item/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maya Chen" })).toBeInTheDocument();
    expect(screen.getByText(/standard access/i)).toBeInTheDocument();

    openView("Graph");
    fireEvent.click(screen.getAllByRole("button", { name: /Exception review/i })[0]);
    expect(screen.getByRole("heading", { name: /Exception review/i })).toBeInTheDocument();
    expect(screen.getByText(/routes exceptions into review and learning signals/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Finance system access/i }));
    expect(screen.getByRole("heading", { name: /Finance system access/i })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    expect(screen.getByRole("heading", { name: /Is the automation safe to approve and run\?/i })).toBeInTheDocument();
    openTechnicalDetails();
    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Review before execution/i })).toBeInTheDocument();
    openView("Review & Run");
    await screen.findByRole("button", { name: /Execute workflow/i });
    expect(screen.getByRole("button", { name: /Execute workflow/i })).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Approve/i })[0]);

    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Execute workflow/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Execute workflow/i }));

    openTechnicalDetails();
    expect(screen.getByRole("heading", { name: /Workflow runner/i })).toBeInTheDocument();
    expect(screen.getByText(/simulated task IT-2001 created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human-review lane/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Workflow executed successfully/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Execution audit trail/i })).toBeInTheDocument();

    openView("Audit");
    expect(screen.getByText(/Simulated execution run/i)).toBeInTheDocument();

    openView("Audit");
    await screen.findByRole("button", { name: /Export Summary/i });
    fireEvent.click(screen.getByRole("button", { name: /Export Summary/i }));

    expect((screen.getByRole("textbox", { name: "Execution summary JSON" }) as HTMLTextAreaElement).value).toContain(
      "it-access"
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset workflow state/i }));

    expect(screen.queryByRole("heading", { name: /Workflow runner/i })).not.toBeInTheDocument();
    openView("Review & Run");
    expect(screen.getByText(/No proposal generated/i)).toBeInTheDocument();
  });

  it("blocks simulated execution when governance rejects the proposal", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /Reject/i })[0]);

    expect(screen.getAllByText(/Rejected/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Execute workflow/i })).toBeDisabled();
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
  ])("generates proposals and inspects details for $scenarioId", async ({ scenarioId, graphTitle, patternLabel, workflowHeading }) => {
    render(<App />);
    await launchDemo();

    fireEvent.change(screen.getByRole("combobox", { name: /Select workflow/i }), {
      target: { value: scenarioId }
    });
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: graphTitle })).toBeInTheDocument();

    openView("Overview");
    expect(screen.getByRole("heading", { name: workflowHeading })).toBeInTheDocument();
    openView("Graph");
    fireEvent.click(screen.getAllByRole("button", { name: /Manager approval/i })[0]);
    expect(screen.getByRole("heading", { name: /Manager approval/i })).toBeInTheDocument();
    expect(screen.getAllByText(/cases waited at least 24 hours for manager approval/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: patternLabel }));
    expect(screen.getByRole("heading", { name: patternLabel })).toBeInTheDocument();
    expect(screen.getByText(/Representative cases:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    openTechnicalDetails();
    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
  });

  it("persists proposal history and lets the selected version drive export", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));

    const versionSelector = screen.getByRole("combobox", { name: /Select proposal version/i }) as HTMLSelectElement;

    expect(versionSelector.value).toContain("-v1");

    fireEvent.click(screen.getByRole("button", { name: /Create Revision/i }));

    expect(versionSelector.value).toContain("-v2");
    expect(screen.getAllByText(/Revision v2 refreshes governance review/i).length).toBeGreaterThan(0);

    openView("Audit");
    await screen.findByRole("button", { name: /Export Summary/i });
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

  it("shows a safe error for malformed import summaries", async () => {
    render(<App />);
    await launchDemo();

    openView("Audit");
    fireEvent.change(screen.getByRole("textbox", { name: /Import execution summary JSON/i }), {
      target: {
        value: '{"exportedAt":'
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Import Summary/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Import failed: the provided execution summary is not valid JSON\./i);
    expect(screen.getByRole("heading", { level: 1, name: "Audit" })).toBeInTheDocument();
  });
});

async function launchDemo() {
  fireEvent.click(screen.getByRole("button", { name: "Launch" }));
  await screen.findByRole("button", { name: "Overview" });
}

function openView(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function openTechnicalDetails() {
  const summary = screen.getByText("Technical details");
  const details = summary.closest("details");

  if (!details?.hasAttribute("open")) {
    fireEvent.click(summary);
  }
}
