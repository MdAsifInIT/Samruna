import { StatusPill } from "../../components/shared/StatusPill";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface OverviewViewProps {
  controller: WorkGraphDemoController;
}

export function OverviewView({ controller }: OverviewViewProps) {
  const {
    aiProvider,
    currentStage,
    demoState,
    executionReady,
    governanceDecisionLabel,
    scenario,
    validation
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
          <p>{scenario.description}</p>
          <strong>{scenario.operatorGoal}</strong>
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
            <h2>{currentStage?.label ?? "Load Workflow"}</h2>
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
              <dd>{aiProvider.status.label}</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{validation.valid ? "Fixture checks passed" : "Needs review"}</dd>
            </div>
            <div>
              <dt>Persistence</dt>
              <dd>Local browser state with export and import.</dd>
            </div>
          </dl>
        </article>
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
