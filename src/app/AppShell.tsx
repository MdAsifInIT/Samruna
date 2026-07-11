import {
  Brain,
  ChevronRight,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Circle,
  Loader2
} from "lucide-react";
import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, useState, useEffect } from "react";
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
  onClose: () => void;
  onViewChange: (viewId: ViewId) => void;
}

export function AppShell({ activeView, children, controller, onClose, onViewChange }: AppShellProps) {
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
    isWorkspaceBusy,
    pendingActionLabel,
    resetConfirmationOpen,
    scenario,
    scenarioOptions,
    storageRecoveryWarning
  } = controller;
  
  const activeNavigationItem = navigationItems.find((item) => item.id === activeView) ?? navigationItems[0];
  
  const providerTone: "good" | "warn" =
    providerStatusLabel === "Fallback used" ? "warn" : providerStatusLabel === "Live OpenAI" ? "good" : "warn";
    
  const syncTone: "good" | "warn" | "blocked" =
    backendSyncStatus === "synced" ? "good" : backendSyncStatus === "error" ? "blocked" : "warn";
    
  const isSyncingOrConnecting = backendSyncStatus === "syncing" || backendSyncStatus === "connecting";
  const [showTaskLoadingIndicator, setShowTaskLoadingIndicator] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (isSyncingOrConnecting) {
      timeoutId = window.setTimeout(() => setShowTaskLoadingIndicator(true), 300);
    } else {
      setShowTaskLoadingIndicator(false);
    }
    return () => window.clearTimeout(timeoutId);
  }, [isSyncingOrConnecting]);

  const taskLoadingLabel = backendSyncStatus === "syncing" ? "Syncing tasks" : "Loading tasks";
    
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

  const activeNavigationIndex = navigationItems.findIndex((item) => item.id === activeView);
  const nextNavigationItem = activeNavigationIndex >= 0 ? navigationItems[activeNavigationIndex + 1] : undefined;
  const nextNavigationState = nextNavigationItem ? getNavState(nextNavigationItem.id) : "locked";
  const nextDisabled = !nextNavigationItem || nextNavigationState === "locked";
  const nextTitle = nextNavigationItem
    ? nextDisabled
      ? `Complete the current step to unlock ${nextNavigationItem.label}`
      : `Go to ${nextNavigationItem.label}`
    : "No next step available";

  const goToNextStep = () => {
    if (!nextNavigationItem || nextDisabled) return;
    onViewChange(nextNavigationItem.id);
  };

  const resetWorkflow = (event: ReactMouseEvent<HTMLButtonElement>) => {
    actions.requestReset(event.currentTarget);
  };

  const resizeSidebarWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (sidebarCollapsed) return;
    const step = event.shiftKey ? 24 : 8;
    let nextWidth: number | undefined;
    if (event.key === "ArrowLeft") nextWidth = sidebarWidth - step;
    if (event.key === "ArrowRight") nextWidth = sidebarWidth + step;
    if (event.key === "Home") nextWidth = SIDEBAR_MIN_WIDTH;
    if (event.key === "End") nextWidth = SIDEBAR_MAX_WIDTH;
    if (nextWidth === undefined) return;
    event.preventDefault();
    setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, nextWidth)));
  };

  return (
    <div className={shellClassName} style={shellStyle} aria-busy={isWorkspaceBusy}>
      <aside className="sidebar" aria-label="Primary navigation" aria-expanded={!sidebarCollapsed}>
        <div className="brand-block">
          <a
            className="brand-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onClose();
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
          <button type="button" className="sidebar-reset-button" aria-label="Reset workflow" disabled={isWorkspaceBusy} onClick={resetWorkflow}>
            <RotateCcw size={16} />
            <span className="sidebar-label">Reset workflow</span>
          </button>
          <p className="sidebar-footer-scenario" title={scenario.workflowName}>{scenario.workflowName}</p>
          <div className="sidebar-footer-status">
            <span className={`status-dot ${providerTone}`} title={providerStatusDetail} /> <span className="sidebar-label">AI</span>
            {showTaskLoadingIndicator ? (
              <span className="task-loading-indicator" role="status" aria-live="polite" aria-label={taskLoadingLabel}>
                <Loader2 size={12} aria-hidden="true" />
              </span>
            ) : (
              <span className={`status-dot ${syncTone}`} title={backendSyncStatusToLabel(backendSyncStatus)} />
            )}
            <span className="sidebar-label">Sync</span>
          </div>
        </div>
        <div
          className="sidebar-resize-handle"
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth}
          aria-valuetext={`${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth} pixels`}
          tabIndex={sidebarCollapsed ? -1 : 0}
          onKeyDown={resizeSidebarWithKeyboard}
          onPointerDown={beginSidebarResize}
        />
      </aside>

      <main className="main-shell">
        {backendSyncError && (
          <div className="toast-banner error-toast" role="status">
            <span>{backendSyncError}</span>
            <div className="toast-actions">
              <button type="button" disabled={isWorkspaceBusy} onClick={actions.retryBackendSync}>
                <RefreshCw size={14} /> Retry
              </button>
              <button type="button" disabled={isWorkspaceBusy} onClick={(event) => actions.requestReset(event.currentTarget)}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        )}

        {storageRecoveryWarning ? <div className="toast-banner" role="status">{storageRecoveryWarning}</div> : null}

        <header className="compact-header" aria-label="Workflow controls">
          <div className="header-left">
            <BrandLogo variant="compact" showWordmark={false} />
            <h1>{activeNavigationItem.label}</h1>
          </div>
          
          <div className="header-center">
            <label className="mobile-view-picker">
              <span>View</span>
              <select
                aria-label="Select app view"
                className="apple-select"
                value={activeView}
                disabled={isWorkspaceBusy}
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
                  disabled={isWorkspaceBusy}
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
                disabled={isWorkspaceBusy}
                onClick={actions.loadSelectedScenario}
              >
                Load
              </ToolbarButton>
              <ToolbarButton
                icon={Network}
                aria-label="Analyze workflow"
                title="Analyze workflow"
                className="toolbar-button-primary"
                disabled={!demoState.sampleLoaded || isWorkspaceBusy}
                onClick={actions.analyzeWorkflow}
              >
                Analyze
              </ToolbarButton>
              <ToolbarButton
                icon={Brain}
                aria-label="Generate automation proposal"
                title="Generate automation proposal"
                className="toolbar-button-primary"
                disabled={!demoState.analysisRequested || !proposalGenerationReady || isWorkspaceBusy}
                onClick={actions.generateProposalFromCurrentState}
              >
                Generate
              </ToolbarButton>
            </div>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="next-flow-button"
              aria-label="Next"
              disabled={nextDisabled || isWorkspaceBusy}
              title={nextTitle}
              onClick={goToNextStep}
            >
              <span>Next</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="demo-boundary-banner" role="note">
          <strong>Demo environment</strong> · simulated execution · no external systems modified
        </div>
        {pendingActionLabel ? <p className="workspace-progress" role="status" aria-live="polite">{pendingActionLabel}…</p> : null}
        <div className="view-content">{children}</div>
      </main>
      {resetConfirmationOpen ? (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(event) => event.target === event.currentTarget && actions.cancelReset()}
          onKeyDown={(event) => event.key === "Escape" && actions.cancelReset()}
        >
          <div className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
            <h2 id="reset-dialog-title">Reset workflow?</h2>
            <p id="reset-dialog-description">This clears analysis, proposals, governance decisions, simulated runs, and audit events for {scenario.workflowName}.</p>
            <div className="reset-dialog-actions">
              <button type="button" autoFocus onClick={actions.cancelReset}>Cancel</button>
              <button type="button" className="reject-button" onClick={() => { actions.confirmReset(); onViewChange("overview"); }}>Reset workflow</button>
            </div>
          </div>
        </div>
      ) : null}
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
