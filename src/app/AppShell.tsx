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
        <section className="topbar" aria-label="Demo controls">
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
            <label className="scenario-picker">
              <span>Scenario</span>
              <select
                aria-label="Select demo scenario"
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
              aria-label="Load scenario"
              title="Load scenario"
              onClick={() => {
                actions.loadSelectedScenario();
                onViewChange("observe");
              }}
            >
              Load Scenario
            </ToolbarButton>
            <ToolbarButton
              icon={Network}
              aria-label="Analyze workflow"
              title="Analyze workflow"
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
              disabled={!demoState.analysisRequested || !proposalGenerationReady}
              onClick={() => {
                actions.generateProposalFromCurrentState();
                onViewChange("plan");
              }}
            >
              Generate Proposal
            </ToolbarButton>
            <ToolbarButton
              icon={ShieldCheck}
              aria-label="Approve"
              title="Approve proposal"
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
              aria-label="Run safe mock execution"
              title={executionReady ? "Run safe mock execution" : "Governance approval is required before mock execution can run"}
              disabled={!executionReady}
              onClick={() => {
                actions.runMockExecution();
                onViewChange("execute");
              }}
            >
              Run Mock
            </ToolbarButton>
            <ToolbarButton
              icon={Download}
              aria-label="Export Summary"
              title="Export Summary"
              onClick={() => {
                actions.exportSummary();
                onViewChange("review");
              }}
            >
              Export Summary
            </ToolbarButton>
            <ToolbarButton
              icon={RotateCcw}
              aria-label="Reset seeded demo state"
              title="Reset seeded demo state"
              onClick={() => {
                actions.resetDemo();
                onViewChange("overview");
              }}
            >
              Reset
            </ToolbarButton>
          </div>
        </section>

        <section className="shell-context" aria-label="Shell context">
          <span>{scenario.label}</span>
          <StatusPill tone={demoState.sampleLoaded ? "good" : "neutral"}>
            {demoState.sampleLoaded ? "Loaded" : "Seeded"}
          </StatusPill>
          <StatusPill tone={executionReady ? "good" : "warn"}>{executionReady ? "Execution open" : "Governed gate"}</StatusPill>
          <StatusPill tone={demoState.governanceDecision === "rejected" ? "blocked" : "neutral"}>
            {governanceDecisionLabel}
          </StatusPill>
        </section>

        <div className="view-content">{children}</div>
      </main>
    </div>
  );
}
