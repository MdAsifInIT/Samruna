import { EmptyState } from "../../components/shared/EmptyState";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface ExecuteViewProps {
  controller: WorkGraphDemoController;
}

export function ExecuteView({ controller }: ExecuteViewProps) {
  const {
    demoState,
    executionGateCopy,
    executionGateLabel,
    executionReady,
    executionRun,
    fixtures,
    learningRecommendation,
    proposal
  } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Execute</p>
        <h2>Execution and workflow operations</h2>
      </section>

      {proposal ? (
        <section className="execution-panel" aria-label="Execution and learning loop">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Execution layer</p>
              <h2>Workflow runner</h2>
            </div>
            <strong className="opportunity-score">{executionGateLabel}</strong>
          </div>
          <p className="execution-boundary">{executionGateCopy}</p>
          <div className="execution-grid">
            <article>
              <h3>Incoming request</h3>
              <p>{fixtures.newIncomingTrace.body}</p>
            </article>
            <article>
              <h3>Simulated tool calls</h3>
              {executionRun?.mockToolCalls.length ? (
                <ul>
                  {executionRun.mockToolCalls.map((call) => (
                    <li key={call.tool}>
                      <strong>{call.tool}</strong>: {call.output}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {executionRun
                    ? executionRun.auditTrail[0]
                    : executionReady
                      ? "Run the simulation to generate tool calls."
                      : demoState.governanceDecision === "rejected"
                        ? "Execution is blocked by rejection until the proposal is revised and approved."
                        : "Execution is blocked until approval opens the gate."}
                </p>
              )}
            </article>
            <article>
              <h3>Learning loop</h3>
              <p>
                {learningRecommendation
                  ? `${learningRecommendation.recommendation} ${learningRecommendation.expectedImpact}`
                  : "Learning recommendation appears after a run."}
              </p>
            </article>
          </div>
          {executionRun ? (
            <div className="execution-audit">
              <h3>Execution audit trail</h3>
              <ol>
                {executionRun.auditTrail.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : (
        <EmptyState title="No execution plan" action="Generate and approve a proposal before running the simulation." />
      )}
    </>
  );
}
