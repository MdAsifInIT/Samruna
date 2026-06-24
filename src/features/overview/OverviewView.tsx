import { Activity, CheckCircle2, GitBranch, ListChecks, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { MetricCard } from "../../components/shared/MetricCard";
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

  return (
    <>
      <section className="status-grid" aria-label="Operational summary">
        <MetricCard icon={ListChecks} label="Selected scenario" value={scenario.label} />
        <MetricCard icon={GitBranch} label="Demo path" value={scenario.workflowName} />
        <MetricCard icon={GitBranch} label="Current stage" value={currentStage?.label ?? "Load Scenario"} />
        <MetricCard icon={Sparkles} label="AI mode" value={aiProvider.status.label} />
        <MetricCard icon={ShieldCheck} label="Governance" value={governanceDecisionLabel} />
        <MetricCard icon={ShieldAlert} label="Mock safety boundary" value="Mock-only, no external writes" />
      </section>

      <section className="operator-console" aria-label="Scenario operator console">
        <div>
          <p className="eyebrow">Selected workflow</p>
          <h2>{scenario.workflowName}</h2>
          <p>{scenario.description}</p>
          <strong>{scenario.operatorGoal}</strong>
        </div>
        <div className="operator-card">
          <div className="panel-heading">
            <ListChecks size={18} />
            <h2>Operator path</h2>
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
              <dd>Mock tools only, approval gated, no external writes.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="demo-strip" aria-label="Scripted demo path">
        {workflowStages.map((stage) => (
          <span
            key={stage.id}
            data-active={stage.state === "complete"}
            data-current={stage.state === "current"}
            data-locked={stage.state === "locked"}
            title={stage.detail}
          >
            {stage.index} {stage.label}
          </span>
        ))}
      </section>

      <section className="status-grid" aria-label="System status">
        <MetricCard icon={Activity} label="Scenario state" value={demoState.sampleLoaded ? "Loaded" : "Seeded"} />
        <MetricCard icon={Sparkles} label="AI mode" value={aiProvider.status.label} />
        <MetricCard icon={ShieldCheck} label="Execution" value={executionReady ? "Approved gate" : "Governed gate"} />
        <MetricCard icon={CheckCircle2} label="Fixture validation" value={validation.valid ? "Valid" : "Needs review"} />
      </section>

      <section className="quick-action-panel" aria-label="Current readiness state">
        <div>
          <p className="eyebrow">Quick next action</p>
          <h2>{currentStage?.label ?? "Load Scenario"}</h2>
          <p>{currentStage?.detail ?? "Load the selected scenario to begin."}</p>
        </div>
        <StatusPill tone={executionReady ? "good" : demoState.governanceDecision === "rejected" ? "blocked" : "warn"}>
          {executionReady ? "Ready to run mock" : governanceDecisionLabel}
        </StatusPill>
      </section>

      <section className="dashboard-grid" aria-label="Operating dashboard">
        {foundationPanels.map((panel) => {
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
    </>
  );
}
