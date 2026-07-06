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

      {demoState.sampleLoaded ? (
        <>
          <div className="dashboard-bento">
            <section className="bento-card metrics-card" aria-label="Loaded workflow summary">
              <h2 style={{ marginBottom: 0, fontSize: 'var(--text-title)' }}>Source Evidence</h2>
              <div className="overview-facts">
                <span><strong>Raw traces</strong>{validation.summary.rawTraceCount}</span>
                <span><strong>Cases</strong>{validation.summary.caseCount}</span>
                <span><strong>Policies</strong>{validation.summary.policyRuleCount}</span>
                <span><strong>Approval records</strong>{validation.summary.approvalRecordCount}</span>
              </div>
            </section>

            <section className="bento-card metrics-card" aria-label="Sample source channels">
              <h2 style={{ marginBottom: 0, fontSize: 'var(--text-title)' }}>Channels</h2>
              <div className="overview-facts">
                {Object.entries(validation.summary.channelCounts).map(([channel, count]) => (
                  <span key={channel}>
                    <strong>{channelLabels[channel as SourceChannel]}</strong>
                    {count}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : (
        <EmptyState title="No workflow loaded" action="Load a workflow to inspect source channels and data validation." />
      )}

      {ingestion ? (
        <div className="dashboard-bento" style={{ marginTop: '0' }}>
          <section className="bento-card quick-action-card" aria-label="Ingestion summary">
            <div className="overview-facts" style={{ marginTop: '0', width: '100%', display: 'flex', gap: 'var(--gap-sm)' }}>
              <span style={{ flex: 1 }}><strong>Normalized items</strong>{ingestion.summary.normalizedItemCount}</span>
              <span style={{ flex: 1 }}><strong>Warnings</strong>{ingestion.summary.issueCount}</span>
              <span style={{ flex: 1 }}><strong>{scenario.topSystemLabel}</strong>{topSystem?.[0] ?? "None"}</span>
              <span style={{ flex: 1 }}><strong>Top system cases</strong>{topSystem?.[1] ?? 0}</span>
            </div>
          </section>
        </div>
      ) : demoState.sampleLoaded ? (
        <EmptyState title="Evidence available" action="Analyze the workflow to normalize source traces into work items." />
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
