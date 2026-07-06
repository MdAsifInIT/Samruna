import {
  Brain,
  Database,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Circle
} from "lucide-react";
import type { ReactNode } from "react";
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

  const getNavState = (viewId: ViewId) => {
    if (viewId === "overview") return "complete";
    if (viewId === "evidence") return demoState.sampleLoaded ? "complete" : "available";
    if (viewId === "graph") return demoState.analysisRequested ? "complete" : (demoState.sampleLoaded ? "available" : "locked");
    if (viewId === "review-run") return demoState.proposalRequested ? "complete" : (proposalGenerationReady ? "available" : "locked");
    if (viewId === "audit") return demoState.runRequested ? "complete" : (controller.executionReady ? "available" : "locked");
    return "locked";
  };

  const getNavIcon = (state: string) => {
    if (state === "complete") return <CheckCircle2 size={16} className="nav-icon-complete" />;
    if (state === "locked") return <Lock size={14} className="nav-icon-locked" />;
    return <Circle size={14} className="nav-icon-pending" />;
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <strong>Work Graph Foundry</strong>
        </div>
        <nav className="menu-list">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const state = getNavState(item.id);
            const isLocked = state === "locked";

            return (
              <button
                key={item.id}
                type="button"
                aria-current={activeView === item.id ? "page" : undefined}
                disabled={isLocked}
                onClick={() => onViewChange(item.id)}
                className={isLocked ? "nav-locked" : ""}
              >
                <div className="nav-item-content">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {getNavIcon(state)}
              </button>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <p className="sidebar-footer-scenario" title={scenario.workflowName}>{scenario.workflowName}</p>
          <div className="sidebar-footer-status">
            <span className={`status-dot ${providerTone}`} title={providerStatusDetail} /> AI
            <span className={`status-dot ${syncTone}`} title={backendSyncStatusToLabel(backendSyncStatus)} /> Sync
          </div>
        </div>
      </aside>

      <main className="main-shell">
        {backendSyncError && (
          <div className="toast-banner error-toast" role="status">
            <span>{backendSyncError}</span>
            <div className="toast-actions">
              <button type="button" onClick={actions.retryBackendSync}>
                <RefreshCw size={14} /> Retry
              </button>
              <button type="button" onClick={actions.resetDemo}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        )}

        <header className="compact-header" aria-label="Workflow controls">
          <div className="header-left">
            <h1>{activeNavigationItem.label}</h1>
          </div>
          
          <div className="header-center">
            <div className="toolbar-inline">
              <label className="scenario-picker-inline">
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
                Load
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
                Generate
              </ToolbarButton>
            </div>
          </div>

          <div className="header-right">
             <div className="compact-status" title={providerFallbackMessage || providerStatusDetail}>
               <span className={`status-indicator ${providerTone}`} />
             </div>
          </div>
        </header>

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
