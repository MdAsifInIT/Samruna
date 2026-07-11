import { StatusPill } from "../../components/shared/StatusPill";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";
import { executionStatusPresentation } from "../../domain/executionPresentation";

interface OverviewViewProps {
  controller: WorkGraphDemoController;
}

export function OverviewView({ controller }: OverviewViewProps) {
  const {
    aiProvider,
    backendSyncStatus,
    currentStage,
    demoState,
    executionReady,
    executionRun,
    governanceDecisionLabel,
    graph,
    providerFallbackMessage,
    providerStatusDetail,
    providerStatusLabel,
    scenario,
    simulation,
    validation,
    workflowStages
  } = controller;
  const hasLoadedWorkflow = demoState.sampleLoaded;
  const hasGraph = demoState.analysisRequested && Boolean(graph);
  const hasProposal = demoState.proposalRequested && Boolean(simulation);
  const hasExecutedWorkflow = Boolean(executionRun);
  const simulationCompleted = executionRun?.status === "completed";
  const executionPresentation = executionRun ? executionStatusPresentation(executionRun.status) : undefined;
  const stateItems = [
    ["Workflow", hasLoadedWorkflow ? "Loaded" : "Not loaded"],
    ["Analysis", hasGraph ? "Graph ready" : "Not analyzed"],
    ["Proposal", hasProposal ? "Generated" : "Not generated"],
    ["Governance", hasProposal ? governanceDecisionLabel : "Awaiting proposal"],
    ["Simulation", executionPresentation?.label ?? (executionReady ? "Available" : "Blocked")]
  ];
  const beforeMetrics = {
    cycleTime: hasGraph ? `${graph?.metrics.averageCycleTimeHours}h` : "Pending",
    approvalDelay: hasGraph ? `${graph?.metrics.approvalDelayHours}h` : "Pending",
    exceptionRate: hasGraph && graph ? `${Math.round(graph.metrics.exceptionRate * 100)}%` : "Pending"
  };
  const afterMetrics = {
    cycleTime: hasExecutedWorkflow && graph && simulation
      ? `${Math.max(0, Math.round(graph.metrics.averageCycleTimeHours - simulation.avoidedDelayHours))}h`
      : "Run to forecast",
    approvalDelay: hasExecutedWorkflow ? "2h" : "Run to forecast",
    exceptionRate: hasExecutedWorkflow ? "0%" : "Run to forecast",
    manualSteps: hasExecutedWorkflow ? "1" : "Run to forecast",
    auditTrail: hasExecutedWorkflow ? "Full" : "Run to forecast"
  };
  const nextActionTone = hasExecutedWorkflow
    ? simulationCompleted ? "good" : "blocked"
    : demoState.governanceDecision === "rejected"
      ? "blocked"
      : "warn";
  const nextActionLabel = hasExecutedWorkflow
    ? executionPresentation?.headline ?? "Simulation recorded"
    : executionReady
      ? "Ready to simulate"
      : governanceDecisionLabel;
  const boundaryNotice =
    scenario.id === "procurement-intake" && scenario.syntheticDataNotice.startsWith("All procurement requesters")
      ? ""
      : scenario.syntheticDataNotice;

  return (
    <>
    <div className="dashboard-bento">
      <section className="bento-card hero-card" aria-label="Operational summary">
        <div className="overview-summary">
          <h2>{scenario.workflowName}</h2>
          <p>{scenario.operatorGoal}</p>
          <strong>{currentStage?.label ?? "Load Workflow"}</strong>
          <div className="overview-facts" aria-label="Workflow context">
            {stateItems.map(([label, value]) => (
              <span key={label}>
                <strong>{label}</strong>
                {value}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bento-card action-card" aria-label="Next best action">
        <div className="overview-next">
          <div>
            <h2>Next best action</h2>
            <p>{currentStage?.detail ?? "Load the selected workflow to begin."}</p>
          </div>
          <StatusPill tone={nextActionTone}>
            {nextActionLabel}
          </StatusPill>
        </div>
      </section>

      <section className="bento-card metrics-card before-panel">
        <h2>Fixture baseline - Manual Process</h2>
        <dl>
          <div>
            <dt>Cycle time</dt>
            <dd><strong className="metric-before">{beforeMetrics.cycleTime}</strong></dd>
          </div>
          <div>
            <dt>Approval delay</dt>
            <dd><strong className="metric-before">{beforeMetrics.approvalDelay}</strong></dd>
          </div>
          <div>
            <dt>Exception rate</dt>
            <dd><strong className="metric-before">{beforeMetrics.exceptionRate}</strong></dd>
          </div>
          <div>
            <dt>Manual steps</dt>
            <dd><strong className="metric-before">{hasGraph ? "6" : "Pending"}</strong></dd>
          </div>
          <div>
            <dt>Audit trail</dt>
            <dd><strong className="metric-before">{hasGraph ? "None" : "Pending"}</strong></dd>
          </div>
        </dl>
      </section>

      <section className="bento-card metrics-card after-panel" data-executed={simulationCompleted ? "true" : "false"}>
        <h2>Scenario forecast - Governed Automation</h2>
        <dl>
          <div>
            <dt>Cycle time</dt>
            <dd><strong className="metric-after">{afterMetrics.cycleTime}</strong></dd>
          </div>
          <div>
            <dt>Approval delay</dt>
            <dd><strong className="metric-after">{afterMetrics.approvalDelay}</strong> {hasExecutedWorkflow ? <span className="metric-delta">auto-routed</span> : null}</dd>
          </div>
          <div>
            <dt>Exception rate</dt>
            <dd><strong className="metric-after">{afterMetrics.exceptionRate}</strong> {hasExecutedWorkflow ? <span className="metric-delta">policy-gated</span> : null}</dd>
          </div>
          <div>
            <dt>Manual steps</dt>
            <dd><strong className="metric-after">{afterMetrics.manualSteps}</strong> {hasExecutedWorkflow ? <span className="metric-delta">approve only</span> : null}</dd>
          </div>
          <div>
            <dt>Audit trail</dt>
            <dd><strong className="metric-after">{afterMetrics.auditTrail}</strong> {hasExecutedWorkflow ? <span className="metric-delta">every step logged</span> : null}</dd>
          </div>
        </dl>
      </section>

      <section className="bento-card boundary-card">
        <h2>Review boundary</h2>
        {boundaryNotice ? <p>{boundaryNotice}</p> : null}
        <dl>
          <div>
            <dt>Needs</dt>
            <dd>{scenario.requiredOrgData.slice(0, 4).join(", ")}</dd>
          </div>
          <div>
            <dt>Never needs</dt>
            <dd>{scenario.excludedOrgData.slice(0, 4).join(", ")}</dd>
          </div>
          <div>
            <dt>Safety</dt>
            <dd>Simulated tools only, approval gated, no external writes.</dd>
          </div>
        </dl>
      </section>

      <section className="bento-card status-card" aria-label="System status">
        <h2>System status</h2>
        <dl>
          <div>
            <dt>Provider</dt>
            <dd>{providerStatusLabel}</dd>
          </div>
          <div>
            <dt>Model mode</dt>
            <dd>
              {aiProvider.status.mode === "openai" ? "Live OpenAI proposal generation" : "Validation engine proposal generation"}
              {aiProvider.status.model ? ` (${aiProvider.status.model})` : ""}
            </dd>
          </div>
          <div>
            <dt>Last generation</dt>
            <dd>{providerFallbackMessage || providerStatusDetail}</dd>
          </div>
          <div>
            <dt>Validation</dt>
            <dd>{validation.valid ? "Data validation passed" : "Needs review"}</dd>
          </div>
          <div>
            <dt>Persistence</dt>
            <dd>
              {backendSyncStatus === "synced"
                ? "Backend connected. SQLite state is authoritative; browser mirror is for reload recovery."
                : "Browser fallback mirror is active until the backend reconnects."}
            </dd>
          </div>
        </dl>
      </section>

      {!validation.valid && (
        <section className="bento-card quick-action-card error-card" aria-label="Data validation">
          <div>
            <p className="eyebrow">Validation</p>
            <h2>Needs review</h2>
            <p>Data checks found issues. Review baseline data before using the workflow.</p>
          </div>
          <StatusPill tone="blocked">Needs review</StatusPill>
        </section>
      )}
    </div>
    </>
  );
}
