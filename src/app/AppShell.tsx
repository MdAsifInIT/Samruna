import {
  Brain,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Circle
} from "lucide-react";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useState } from "react";
import { BrandLogo } from "../components/shared/BrandLogo";
import { ToolbarButton } from "../components/shared/ToolbarButton";
import type { ScenarioId } from "../domain/types";
import { navigationItems, type ViewId } from "./navigation";
import type { WorkGraphDemoController } from "./useWorkGraphDemoController";

const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_MIN_WIDTH = 208;
const SIDEBAR_MAX_WIDTH = 340;
const SIDEBAR_DEFAULT_WIDTH = 240;

interface AppShellProps {
  activeView: ViewId;
  children: ReactNode;
  controller: WorkGraphDemoController;
  onViewChange: (viewId: ViewId) => void;
}

export function AppShell({ activeView, children, controller, onViewChange }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarResizing, setSidebarResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
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
    
  const shellStyle = {
    "--sidebar-width": `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth}px`
  } as CSSProperties;

  const shellClassName = [
    "app-shell",
    sidebarCollapsed ? "sidebar-collapsed" : "",
    sidebarResizing ? "sidebar-resizing" : ""
  ].filter(Boolean).join(" ");

  const beginSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (sidebarCollapsed) return;

    event.preventDefault();
    const resizeHandle = event.currentTarget;
    if (typeof resizeHandle.setPointerCapture === "function") {
      resizeHandle.setPointerCapture(event.pointerId);
    }
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    setSidebarResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      window.removeEventListener("blur", stopResize);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      setSidebarResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    window.addEventListener("blur", stopResize);
  };

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

  const resetWorkflow = () => {
    actions.resetDemo();
    onViewChange("overview");
  };

  return (
    <div className={shellClassName} style={shellStyle}>
      <aside className="sidebar" aria-label="Primary navigation" aria-expanded={!sidebarCollapsed}>
        <div className="brand-block">
          <a
            className="brand-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(window.history.state, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            <BrandLogo variant="sidebar" />
          </a>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
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
                aria-label={item.label}
                disabled={isLocked}
                onClick={() => onViewChange(item.id)}
                className={isLocked ? "nav-locked" : ""}
              >
                <div className="nav-item-content">
                  <Icon size={18} />
                  <span className="sidebar-label">{item.label}</span>
                </div>
                {getNavIcon(state)}
              </button>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <button type="button" className="sidebar-reset-button" aria-label="Reset workflow" onClick={resetWorkflow}>
            <RotateCcw size={16} />
            <span className="sidebar-label">Reset workflow</span>
          </button>
          <p className="sidebar-footer-scenario" title={scenario.workflowName}>{scenario.workflowName}</p>
          <div className="sidebar-footer-status">
            <span className={`status-dot ${providerTone}`} title={providerStatusDetail} /> <span className="sidebar-label">AI</span>
            <span className={`status-dot ${syncTone}`} title={backendSyncStatusToLabel(backendSyncStatus)} /> <span className="sidebar-label">Sync</span>
          </div>
        </div>
        <div
          className="sidebar-resize-handle"
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          onPointerDown={beginSidebarResize}
        />
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
            <BrandLogo variant="compact" showWordmark={false} />
            <h1>{activeNavigationItem.label}</h1>
          </div>
          
          <div className="header-center">
            <label className="mobile-view-picker">
              <select
                aria-label="Select app view"
                className="apple-select"
                value={activeView}
                onChange={(event) => onViewChange(event.target.value as ViewId)}
              >
                {navigationItems.map((item) => {
                  const state = getNavState(item.id);

                  return (
                    <option key={item.id} value={item.id} disabled={state === "locked"}>
                      {item.label}
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="toolbar-inline">
              <label className="scenario-picker-inline">
                <span>Workflow</span>
                <select
                  aria-label="Select workflow"
                  className="apple-select"
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
