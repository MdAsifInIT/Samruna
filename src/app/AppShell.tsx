import {
  Brain,
  Database,
  Network,
  RefreshCw,
  RotateCcw
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
    backendSyncError,
    backendSyncStatus,
    demoState,
    executionReady,
    proposalGenerationReady,
    providerFallbackMessage,
    providerStatusDetail,
    providerStatusLabel,
    scenario,
    scenarioOptions
  } = controller;
  const activeNavigationItem = navigationItems.find((item) => item.id === activeView) ?? navigationItems[0];
  const providerTone: "good" | "warn" =
    providerStatusLabel === "Fallback used" ? "warn" : providerStatusLabel === "Live OpenAI" ? "good" : "warn";
  const syncTone: "good" | "warn" | "blocked" =
    backendSyncStatus === "synced" ? "good" : backendSyncStatus === "error" ? "blocked" : "warn";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <p className="eyebrow">Work Graph Foundry</p>
          <strong>Workspace</strong>
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
            <h1>Work Graph Foundry</h1>
            <p className="topbar-summary">{activeNavigationItem.purpose}</p>
            <p className="topbar-meta" aria-label="Workflow context">
              Scenario: {scenario.label} · Step: {activeNavigationItem.label} · Gate:{" "}
              {executionReady ? "Ready to run" : "Approval needed"}
            </p>
            <div className="confidence-strip" aria-label="Backend and provider status">
              <span>
                <strong>AI provider</strong>
                <StatusPill tone={providerTone}>{providerStatusLabel}</StatusPill>
              </span>
              <span>
                <strong>Source of truth</strong>
                <StatusPill tone={syncTone}>{backendSyncStatusToLabel(backendSyncStatus)}</StatusPill>
              </span>
              <span>
                <strong>Execution</strong>
                Mock simulation only
              </span>
            </div>
            <p className="provider-detail" aria-label="Provider detail">
              {providerStatusDetail}
            </p>
            {providerFallbackMessage ? (
              <p className="provider-fallback-alert" role="status">
                {providerFallbackMessage}
              </p>
            ) : null}
            {backendSyncError && (
              <div className="backend-sync-alert" role="status">
                <span>{backendSyncError}</span>
                <button type="button" onClick={actions.retryBackendSync}>
                  <RefreshCw size={14} />
                  Retry backend
                </button>
                <button type="button" onClick={actions.resetDemo}>
                  <RotateCcw size={14} />
                  Reset workflow
                </button>
              </div>
            )}
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
                  onViewChange("evidence");
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
                  onViewChange("graph");
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
                  onViewChange("review-run");
                }}
              >
                Generate Proposal
              </ToolbarButton>
            </div>
          </div>
        </section>

        <div className="view-content">{children}</div>
      </main>
    </div>
  );
}

function backendSyncStatusToLabel(status: WorkGraphDemoController["backendSyncStatus"]): string {
  switch (status) {
    case "synced":
      return "Backend connected";
    case "syncing":
      return "Syncing";
    case "error":
      return "Backend action failed";
    case "fallback":
      return "Browser fallback mirror";
    case "connecting":
    default:
      return "Connecting";
  }
}
