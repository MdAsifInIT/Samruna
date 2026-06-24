import {
  Brain,
  Database,
  Download,
  Network,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusPill } from "../components/shared/StatusPill";
import { ToolbarButton } from "../components/shared/ToolbarButton";
import type { ScenarioId } from "../domain/types";
import { navigationItems, type ViewId } from "./navigation";
import type { WorkGraphDemoController } from "./useWorkGraphDemoController";

interface AppShellProps {
  activeView: ViewId;
  children: ReactNode;
  controller: WorkGraphDemoController;
  onViewChange: (viewId: ViewId) => void;
}

export function AppShell({ activeView, children, controller, onViewChange }: AppShellProps) {
  const {
    actions,
    aiProvider,
    demoState,
    executionReady,
    governanceDecisionLabel,
    proposal,
    proposalGenerationReady,
    scenario,
    scenarioOptions
  } = controller;
  const activeNavigationItem = navigationItems.find((item) => item.id === activeView) ?? navigationItems[0];

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <p className="eyebrow">Work Graph Foundry</p>
          <strong>Operations Console</strong>
        </div>
        <nav className="menu-list">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={activeView === item.id ? "page" : undefined}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-shell">
        <section className="topbar" aria-label="Workflow controls">
          <div className="topbar-title">
            <p className="eyebrow">{activeNavigationItem.label}</p>
            <h1>Enterprise Work Intelligence Console</h1>
            <p className="topbar-summary">{activeNavigationItem.purpose}</p>
          </div>
          <div className="mobile-view-picker">
            <label>
              <span>View</span>
              <select
                aria-label="Select app view"
                value={activeView}
                onChange={(event) => onViewChange(event.target.value as ViewId)}
              >
                {navigationItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="toolbar">
            <div className="toolbar-row toolbar-row-primary" aria-label="Primary workflow controls">
              <label className="scenario-picker">
                <span>Workflow</span>
                <select
                  aria-label="Select workflow"
                  value={demoState.selectedScenarioId}
                  onChange={(event) => {
                    actions.selectScenario(event.target.value as ScenarioId);
                    onViewChange("overview");
                  }}
                >
                  {scenarioOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <ToolbarButton
                icon={Database}
                aria-label="Load workflow"
                title="Load workflow"
                className="toolbar-button-primary"
                onClick={() => {
                  actions.loadSelectedScenario();
                  onViewChange("observe");
                }}
              >
                Load Workflow
              </ToolbarButton>
              <ToolbarButton
                icon={Network}
                aria-label="Analyze workflow"
                title="Analyze workflow"
                className="toolbar-button-primary"
                disabled={!demoState.sampleLoaded}
                onClick={() => {
                  actions.analyzeWorkflow();
                  onViewChange("analyze");
                }}
              >
                Analyze
              </ToolbarButton>
              <ToolbarButton
                icon={Brain}
                aria-label="Generate automation proposal"
                title="Generate automation proposal"
                className="toolbar-button-primary"
                disabled={!demoState.analysisRequested || !proposalGenerationReady}
                onClick={() => {
                  actions.generateProposalFromCurrentState();
                  onViewChange("plan");
                }}
              >
                Generate Proposal
              </ToolbarButton>
            </div>
            <div className="toolbar-row toolbar-row-secondary" aria-label="Governance and utility controls">
              <ToolbarButton
                icon={ShieldCheck}
                aria-label="Approve"
                title="Approve proposal"
                className="toolbar-button-approve"
                disabled={!proposal}
                onClick={() => {
                  actions.approveProposal();
                  onViewChange("govern");
                }}
              >
                Approve
              </ToolbarButton>
              <ToolbarButton
                icon={XCircle}
                aria-label="Reject"
                title="Reject proposal"
                className="toolbar-button-secondary toolbar-button-danger"
                disabled={!proposal}
                onClick={() => {
                  actions.rejectProposal();
                  onViewChange("govern");
                }}
              >
                Reject
              </ToolbarButton>
              <ToolbarButton
                icon={Play}
                aria-label="Run simulation"
                title={executionReady ? "Run simulation" : "Governance approval is required before simulation can run"}
                className="toolbar-button-run"
                disabled={!executionReady}
                onClick={() => {
                  actions.runMockExecution();
                  onViewChange("execute");
                }}
              >
                Run Simulation
              </ToolbarButton>
              <ToolbarButton
                icon={Download}
                aria-label="Export Summary"
                title="Export Summary"
                className="toolbar-button-secondary"
                onClick={() => {
                  actions.exportSummary();
                  onViewChange("review");
                }}
              >
                Export Summary
              </ToolbarButton>
              <ToolbarButton
                icon={RotateCcw}
                aria-label="Reset workflow state"
                title="Reset workflow state"
                className="toolbar-button-secondary"
                onClick={() => {
                  actions.resetDemo();
                  onViewChange("overview");
                }}
              >
                Reset
              </ToolbarButton>
            </div>
          </div>
        </section>

        <section className="shell-context" aria-label="Shell context">
          <span>{scenario.label}</span>
          <StatusPill tone={demoState.sampleLoaded ? "good" : "neutral"}>
            {demoState.sampleLoaded ? "Workflow loaded" : "Baseline state"}
          </StatusPill>
          <StatusPill tone="neutral">{aiProvider.status.label}</StatusPill>
          <StatusPill tone="neutral">Controlled local environment</StatusPill>
          <StatusPill tone={demoState.governanceDecision === "rejected" ? "blocked" : "neutral"}>
            {`Governance ${governanceDecisionLabel}`}
          </StatusPill>
          <StatusPill tone={executionReady ? "good" : "warn"}>
            {executionReady ? "Execution available" : "Governed gate"}
          </StatusPill>
        </section>

        <div className="view-content">{children}</div>
      </main>
    </div>
  );
}
