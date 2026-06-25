import { ListChecks, ShieldAlert } from "lucide-react";
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
    foundationPanels,
    governanceDecisionLabel,
    scenario,
    validation,
    workflowStages
  } = controller;
  const operatingCards = foundationPanels.filter((panel) =>
    ["Work Pattern Clusters", "Work Graph", "Governance", "Persistence"].includes(panel.title)
  );

  return (
    <>
      <section className="command-center" aria-label="Operational summary">
        <div className="scenario-summary">
          <p className="eyebrow">Current workflow</p>
          <h2>{scenario.workflowName}</h2>
          <p>{scenario.description}</p>
          <strong>{scenario.operatorGoal}</strong>
          <div className="scenario-facts" aria-label="Workflow context">
            <span>{scenario.label}</span>
            <span>{demoState.sampleLoaded ? "Loaded" : "Baseline"}</span>
            <span>{aiProvider.status.label}</span>
            <span>{governanceDecisionLabel}</span>
          </div>
        </div>

        <div className="next-action-card" aria-label="Next best action">
          <div>
            <p className="eyebrow">Next best action</p>
            <h2>{currentStage?.label ?? "Load Workflow"}</h2>
            <p>{currentStage?.detail ?? "Load the selected workflow to begin."}</p>
          </div>
          <StatusPill tone={executionReady ? "good" : demoState.governanceDecision === "rejected" ? "blocked" : "warn"}>
            {executionReady ? "Ready for simulation" : governanceDecisionLabel}
          </StatusPill>
        </div>
      </section>

      <section className="operator-console" aria-label="Workflow operations console">
        <div className="operator-card">
          <div className="panel-heading">
            <ListChecks size={18} />
            <h2>Workflow steps</h2>
          </div>
          <ol>
            {workflowStages.map((stage) => (
              <li
                key={stage.id}
                data-complete={stage.state === "complete"}
                data-current={stage.state === "current"}
                data-locked={stage.state === "locked"}
              >
                <span>{stage.index}</span>
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="operator-card">
          <div className="panel-heading">
            <ShieldAlert size={18} />
            <h2>Data boundary</h2>
          </div>
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
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Operating dashboard">
        {operatingCards.map((panel) => {
          const Icon = panel.icon;

          return (
            <article className="panel" key={panel.title}>
              <div className="panel-heading">
                <Icon size={18} />
                <h2>{panel.title}</h2>
              </div>
              <p className="panel-value">{panel.value}</p>
              <p className="panel-detail">{panel.detail}</p>
            </article>
          );
        })}
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
