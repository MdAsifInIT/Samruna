import { EmptyState } from "../../components/shared/EmptyState";
import type { SourceChannel } from "../../domain/types";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface ObserveViewProps {
  controller: WorkGraphDemoController;
}

export function ObserveView({ controller }: ObserveViewProps) {
  const { channelLabels, demoState, fixtures, ingestion, sampleItem, scenario, topSystem, validation } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Observe</p>
        <h2>Intake and evidence visibility</h2>
      </section>

      {demoState.sampleLoaded ? (
        <>
          <section className="ingestion-summary" aria-label="Loaded scenario summary">
            <div>
              <span>Raw traces</span>
              <strong>{validation.summary.rawTraceCount}</strong>
            </div>
            <div>
              <span>Cases</span>
              <strong>{validation.summary.caseCount}</strong>
            </div>
            <div>
              <span>Policies</span>
              <strong>{validation.summary.policyRuleCount}</strong>
            </div>
            <div>
              <span>Approval records</span>
              <strong>{validation.summary.approvalRecordCount}</strong>
            </div>
          </section>

          <section className="channel-strip" aria-label="Synthetic source channels">
            {Object.entries(validation.summary.channelCounts).map(([channel, count]) => (
              <span key={channel}>
                {channelLabels[channel as SourceChannel]}: <strong>{count}</strong>
              </span>
            ))}
          </section>
        </>
      ) : (
        <EmptyState title="No scenario loaded" action="Load Scenario to inspect source channels and fixture validation." />
      )}

      {ingestion ? (
        <section className="ingestion-summary" aria-label="Ingestion summary">
          <div>
            <span>Normalized items</span>
            <strong>{ingestion.summary.normalizedItemCount}</strong>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{ingestion.summary.issueCount}</strong>
          </div>
          <div>
            <span>{scenario.topSystemLabel}</span>
            <strong>{topSystem?.[0] ?? "None"}</strong>
          </div>
          <div>
            <span>Top system cases</span>
            <strong>{topSystem?.[1] ?? 0}</strong>
          </div>
        </section>
      ) : demoState.sampleLoaded ? (
        <EmptyState title="Evidence loaded" action="Analyze the workflow to normalize source traces into work items." />
      ) : null}

      {sampleItem ? (
        <section className="evidence-panel" aria-label="Raw to normalized evidence">
          <div>
            <p className="eyebrow">Observed evidence</p>
            <h2>Raw trace to normalized work item</h2>
          </div>
          <div className="evidence-grid">
            <article>
              <h3>{fixtures.rawTraces[0].subject}</h3>
              <p>{fixtures.rawTraces[0].body}</p>
            </article>
            <article>
              <h3>{sampleItem.requester}</h3>
              <dl>
                <div>
                  <dt>Department</dt>
                  <dd>{sampleItem.requesterDepartment}</dd>
                </div>
                <div>
                  <dt>Request type</dt>
                  <dd>{sampleItem.requestType.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>System</dt>
                  <dd>{sampleItem.systems.join(", ")}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{sampleItem.status.replaceAll("_", " ")}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      ) : null}
    </>
  );
}
