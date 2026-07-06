import { StatusPill } from "../../components/shared/StatusPill";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

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
    governanceDecisionLabel,
    graph,
    providerFallbackMessage,
    providerStatusDetail,
    providerStatusLabel,
    scenario,
    validation,
    workflowStages
  } = controller;
  const stateItems = [
    ["Workflow", demoState.sampleLoaded ? "Loaded" : "Baseline"],
    ["Analysis", demoState.analysisRequested ? "Graph ready" : "Not started"],
    ["Proposal", demoState.proposalRequested ? "Generated" : "Not generated"],
    ["Governance", governanceDecisionLabel],
    ["Execution", executionReady ? "Available" : "Blocked"]
  ];

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
          <StatusPill tone={executionReady ? "good" : demoState.governanceDecision === "rejected" ? "blocked" : "warn"}>
            {executionReady ? "Ready for simulation" : governanceDecisionLabel}
          </StatusPill>
        </div>
      </section>

      <section className="bento-card metrics-card before-panel">
        <h2>Before - Manual Process</h2>
        <dl>
          <div>
            <dt>Cycle time</dt>
            <dd><strong className="metric-before">{graph?.metrics.averageCycleTimeHours ?? 137}h</strong></dd>
          </div>
          <div>
            <dt>Approval delay</dt>
            <dd><strong className="metric-before">{graph?.metrics.approvalDelayHours ?? 62}h</strong></dd>
          </div>
          <div>
            <dt>Exception rate</dt>
            <dd><strong className="metric-before">{graph ? `${Math.round(graph.metrics.exceptionRate * 100)}%` : "12%"}</strong></dd>
          </div>
          <div>
            <dt>Manual steps</dt>
            <dd><strong className="metric-before">6</strong></dd>
          </div>
          <div>
            <dt>Audit trail</dt>
            <dd><strong className="metric-before">None</strong></dd>
          </div>
        </dl>
      </section>

      <section className="bento-card metrics-card after-panel">
        <h2>After - Governed Automation</h2>
        <dl>
          <div>
            <dt>Cycle time</dt>
            <dd><strong className="metric-after">{graph ? `${Math.round(graph.metrics.averageCycleTimeHours * 0.56)}h` : "77h"}</strong></dd>
          </div>
          <div>
            <dt>Approval delay</dt>
            <dd><strong className="metric-after">2h</strong> <span className="metric-delta">auto-routed</span></dd>
          </div>
          <div>
            <dt>Exception rate</dt>
            <dd><strong className="metric-after">0%</strong> <span className="metric-delta">policy-gated</span></dd>
          </div>
          <div>
            <dt>Manual steps</dt>
            <dd><strong className="metric-after">1</strong> <span className="metric-delta">approve only</span></dd>
          </div>
          <div>
            <dt>Audit trail</dt>
            <dd><strong className="metric-after">Full</strong> <span className="metric-delta">every step logged</span></dd>
          </div>
        </dl>
      </section>

      <section className="bento-card boundary-card">
        <h2>Review boundary</h2>
        <p>{scenario.syntheticDataNotice}</p>
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

      <section className="bento-card status-card">
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
                ? "Backend SQLite state is authoritative; browser mirror is for reload recovery."
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
