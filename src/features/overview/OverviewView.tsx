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
      <section className="overview-hero" aria-label="Operational summary">
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

        <div className="overview-next" aria-label="Next best action">
          <div>
            <h2>Next best action</h2>
            <p>{currentStage?.detail ?? "Load the selected workflow to begin."}</p>
          </div>
          <StatusPill tone={executionReady ? "good" : demoState.governanceDecision === "rejected" ? "blocked" : "warn"}>
            {executionReady ? "Ready for simulation" : governanceDecisionLabel}
          </StatusPill>
        </div>
      </section>

      <section className="overview-boundary" aria-label="Data boundary">
        <article>
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
        </article>
        <article>
          <h2>Demo mode</h2>
          <dl>
            <div>
              <dt>Provider</dt>
              <dd>{providerStatusLabel}</dd>
            </div>
            <div>
              <dt>Model mode</dt>
              <dd>
                {aiProvider.status.mode === "openai" ? "Live OpenAI proposal generation" : "Deterministic mock proposal generation"}
                {aiProvider.status.model ? ` (${aiProvider.status.model})` : ""}
              </dd>
            </div>
            <div>
              <dt>Last generation</dt>
              <dd>{providerFallbackMessage || providerStatusDetail}</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{validation.valid ? "Fixture checks passed" : "Needs review"}</dd>
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
        </article>
      </section>

      <section className="workflow-stage-panel" aria-label="Workflow stage state">
        {workflowStages.map((stage) => (
          <span key={stage.id} data-state={stage.state}>
            <strong>{stage.index}. {stage.label}</strong>
            {stage.state}
          </span>
        ))}
      </section>

      {!validation.valid && (
        <section className="quick-action-panel" aria-label="Data validation">
          <div>
            <p className="eyebrow">Validation</p>
            <h2>Needs review</h2>
            <p>Fixture checks found issues. Review baseline data before using the workflow.</p>
          </div>
          <StatusPill tone="blocked">Needs review</StatusPill>
        </section>
      )}
    </>
  );
}
