import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { AppShell } from "./app/AppShell";
import { createSeedDemoState, DEMO_STORAGE_KEY, saveDemoState } from "./domain/persistence";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState(null, "", "/");
  });

  it("renders the customer-facing landing page first", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Samruna" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Samruna" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Launch" })).toHaveLength(1);
    expect(screen.getByLabelText("Workflow visualization")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Landing workflow blocks" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Impact evidence" })).toBeInTheDocument();
    expect(screen.getByText(/Demo data · simulated execution · no external systems modified/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Overview" })).not.toBeInTheDocument();
  });

  it("opens the path-backed five-view workspace", async () => {
    render(<App />);
    await launchDemo();

    expect(window.location.pathname).toBe("/dashboard");
    expect(getSidebarNavButton("Overview")).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("img", { name: "Samruna" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access request operations" })).toBeInTheDocument();
    expect(getSidebarNavButton("Evidence")).toBeInTheDocument();
    expect(getSidebarNavButton("Graph")).toBeInTheDocument();
    expect(getSidebarNavButton("Review & Run")).toBeInTheDocument();
    expect(getSidebarNavButton("Audit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.getByLabelText("System status")).toHaveTextContent("Provider");
    expect(screen.getByLabelText("System status")).toHaveTextContent("Validation engine");

    const summary = screen.getByRole("region", { name: /Operational summary/i });

    expect(within(summary).getByRole("heading", { name: /Access request operations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fixture baseline - Manual Process" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scenario forecast - Governed Automation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review boundary" })).toBeInTheDocument();
    expect(screen.getByLabelText("Select app view")).toHaveValue("overview");
  });

  it("advances through workspace pages only through the explicit Next button", async () => {
    render(<App />);
    await launchDemo();

    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.queryByText("Raw traces")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByText("Raw traces")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));

    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Graph" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /IT access request flow/i })).toBeInTheDocument();
  });

  it("disables Next when the next workspace page is still locked", async () => {
    render(<App />);
    await launchDemo();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("collapses the sidebar while keeping navigation icons and reset available", async () => {
    render(<App />);
    await launchDemo();

    const appShell = screen.getByLabelText("Primary navigation").closest(".app-shell") as HTMLElement;
    const resizeHandle = screen.getByRole("separator", { name: "Resize sidebar" });

    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset workflow" })).toBeInTheDocument();
    expect(resizeHandle).toBeInTheDocument();
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "240");

    fireEvent.keyDown(resizeHandle, { key: "ArrowRight", shiftKey: true });
    expect(appShell.style.getPropertyValue("--sidebar-width")).toBe("264px");

    fireEvent.pointerDown(resizeHandle, { clientX: 240, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 320, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });

    await waitFor(() => {
      expect(appShell.style.getPropertyValue("--sidebar-width")).toBe("340px");
    });

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(appShell).toHaveClass("sidebar-collapsed");
    expect(appShell.style.getPropertyValue("--sidebar-width")).toBe("72px");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(getSidebarNavButton("Overview").querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset workflow" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(appShell).not.toHaveClass("sidebar-collapsed");
    expect(appShell.style.getPropertyValue("--sidebar-width")).toBe("340px");
  });

  it("opens the workspace directly at /dashboard", async () => {
    window.history.pushState(null, "", "/dashboard");

    render(<App />);

    expect(await findSidebarNavButton("Overview")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  });

  it("normalizes the legacy #demo route to /dashboard", async () => {
    window.history.pushState(null, "", "/#demo");

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
    expect(window.location.hash).toBe("");
    expect(await findSidebarNavButton("Overview")).toHaveAttribute("aria-current", "page");
  });

  it("returns to the landing page on browser back navigation", async () => {
    render(<App />);
    await launchDemo();

    act(() => {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await screen.findByRole("button", { name: "Launch" });
    expect(screen.queryByRole("button", { name: "Overview" })).not.toBeInTheDocument();
  });

  it("shows backend fallback recovery controls when the API is unavailable", async () => {
    render(<App />);
    await launchDemo();

    await waitFor(() => {
      expect(screen.getAllByText(/browser fallback mirror/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("labels the demo boundary and cancels reset without losing state", async () => {
    render(<App />);
    await launchDemo();
    expect(screen.getByText(/Demo environment/i)).toBeInTheDocument();
    expect(screen.getByText(/no external systems modified/i)).toBeInTheDocument();
    expect(screen.getAllByText(/All access request names, tickets, approvals, and systems are synthetic evaluation fixtures/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    const resetButton = screen.getByRole("button", { name: "Reset workflow" });
    fireEvent.click(resetButton);
    const dialog = screen.getByRole("dialog", { name: /Reset workflow/i });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(resetButton).toHaveFocus());
    expect(screen.getByLabelText("Workflow context")).toHaveTextContent("Loaded");

    fireEvent.click(resetButton);
    const reopenedDialog = screen.getByRole("dialog", { name: /Reset workflow/i });
    fireEvent.click(reopenedDialog);
    expect(reopenedDialog).toBeInTheDocument();
    fireEvent.click(reopenedDialog.parentElement as HTMLElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(resetButton).toHaveFocus());
  });

  it("shows a compact task-loading indicator while backend sync is in progress", async () => {
    render(
      <AppShell
        activeView="overview"
        controller={
          {
            actions: {},
            backendSyncError: "",
            backendSyncStatus: "syncing",
            demoState: {
              sampleLoaded: false,
              analysisRequested: false,
              proposalRequested: false,
              runRequested: false,
              selectedScenarioId: "it-access"
            },
            executionReady: false,
            proposalGenerationReady: false,
            providerFallbackMessage: "",
            providerStatusDetail: "",
            providerStatusLabel: "Live OpenAI",
            scenario: { workflowName: "Access request operations" },
            scenarioOptions: []
          } as never
        }
        onClose={() => undefined}
        onViewChange={() => undefined}
      >
        <div />
      </AppShell>
    );

    expect(await screen.findByRole("status", { name: /Syncing tasks/i })).toBeInTheDocument();
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

    expect(screen.getByLabelText("System status")).toHaveTextContent("Browser fallback mirror");
    expect(screen.getAllByText(/Reason code: provider_error/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/OPENAI_API_KEY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
  });

  it("recovers from malformed persisted sessionStorage state", async () => {
    window.sessionStorage.setItem(DEMO_STORAGE_KEY, "{not-json");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Samruna" })).toBeInTheDocument();
    await launchDemo();

    await waitFor(() => {
      expect(window.sessionStorage.getItem(DEMO_STORAGE_KEY)).toContain('"selectedScenarioId":"it-access"');
    });
  });

  it("runs the staged IT access POC - Proof Of Concept path", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Raw traces")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

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
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: /Is the automation safe to approve and run\?/i })).toBeInTheDocument();
    openTechnicalDetails();
    expect(screen.getByRole("heading", { name: /Governed automation proposal/i })).toBeInTheDocument();
    expect(screen.getByText(/Write immutable audit event/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Review before simulation/i })).toBeInTheDocument();
    openView("Review & Run");
    await screen.findByRole("button", { name: /Run simulation/i });
    expect(screen.getByRole("button", { name: /Run simulation/i })).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Approve/i })[0]);

    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run simulation/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Run simulation/i }));

    openTechnicalDetails();
    expect(screen.getByRole("heading", { name: /Workflow runner/i })).toBeInTheDocument();
    expect(screen.getByText(/simulated .* task IT-2001 created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human-review lane/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Simulation completed/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Simulation audit trail/i })).toBeInTheDocument();

    openView("Audit");
    expect(screen.getByText(/Simulated execution run/i)).toBeInTheDocument();

    openView("Audit");
    await screen.findByRole("button", { name: /Export Summary/i });
    fireEvent.click(screen.getByRole("button", { name: /Export Summary/i }));

    expect((screen.getByRole("textbox", { name: "Execution summary JSON" }) as HTMLTextAreaElement).value).toContain(
      "it-access"
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset workflow state/i }));
    const resetDialog = screen.getByRole("dialog", { name: /Reset workflow/i });
    expect(resetDialog).toBeInTheDocument();
    fireEvent.click(within(resetDialog).getByRole("button", { name: "Reset workflow" }));

    expect(screen.queryByRole("heading", { name: /Workflow runner/i })).not.toBeInTheDocument();
    openView("Overview");
    expect(screen.getByLabelText("Workflow context")).toHaveTextContent("Not generated");
  });

  it("blocks simulated execution when governance rejects the proposal", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));
    openView("Review & Run");
    fireEvent.click(screen.getAllByRole("button", { name: /Reject/i })[0]);

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
  ])("generates proposals and inspects details for $scenarioId", async ({ scenarioId, graphTitle, patternLabel, workflowHeading }) => {
    render(<App />);
    await launchDemo();

    fireEvent.change(screen.getByRole("combobox", { name: /Select workflow/i }), {
      target: { value: scenarioId }
    });
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

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
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

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
    openView("Review & Run");

    const versionSelector = screen.getByRole("combobox", { name: /Select proposal version/i }) as HTMLSelectElement;

    expect(versionSelector.value).toContain("-v1");

    fireEvent.click(screen.getByRole("button", { name: /Create Revision/i }));

    expect(versionSelector.value).toContain("-v2");
    expect(screen.getAllByText(/Revision v2 refreshes governance review/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Approve/i })[0]);
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
      expect(window.sessionStorage.getItem(DEMO_STORAGE_KEY)).toContain('"selectedProposalId":"proposal-pattern-standard_access-v2"');
    });
  });

  it("shows a safe error for malformed import summaries", async () => {
    render(<App />);
    await launchDemo();
    fireEvent.click(screen.getByRole("button", { name: /Load workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze workflow/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate automation proposal/i }));
    openView("Review & Run");
    fireEvent.click(screen.getAllByRole("button", { name: /Approve/i })[0]);

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
  await findSidebarNavButton("Overview");
  await waitFor(() => expect(screen.getByRole("button", { name: /Load workflow/i })).toBeEnabled());
}

function openView(name: string) {
  fireEvent.click(getSidebarNavButton(name));
}

function getSidebarNavButton(name: string) {
  return within(screen.getByLabelText("Primary navigation")).getByRole("button", { name });
}

async function findSidebarNavButton(name: string) {
  const primaryNavigation = await screen.findByLabelText("Primary navigation");

  return within(primaryNavigation).findByRole("button", { name });
}

function openTechnicalDetails() {
  const summary = screen.getByText("Technical details");
  const details = summary.closest("details");

  if (!details?.hasAttribute("open")) {
    fireEvent.click(summary);
  }
}
