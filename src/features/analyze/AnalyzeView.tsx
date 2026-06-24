import { EmptyState } from "../../components/shared/EmptyState";
import { graphNodeAuditRelevance, type WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface AnalyzeViewProps {
  controller: WorkGraphDemoController;
}

export function AnalyzeView({ controller }: AnalyzeViewProps) {
  const {
    actions,
    graph,
    patternDetection,
    scenario,
    selectedBottleneck,
    selectedGraphEdges,
    selectedGraphNode,
    selectedOpportunity,
    selectedPattern,
    topBottleneck,
    visualGraph
  } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Analyze</p>
        <h2>Work graph and pattern discovery</h2>
      </section>

      {graph ? (
        <section className="graph-panel" aria-label="Generated work graph">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Work graph</p>
              <h2>{scenario.graphTitle}</h2>
            </div>
            <div className="graph-metrics">
              <span>{graph.metrics.approvalDelayHours}h approval delay</span>
              <span>{Math.round(graph.metrics.exceptionRate * 100)}% exception rate</span>
              <span>{graph.metrics.averageCycleTimeHours}h cycle time</span>
            </div>
          </div>
          {visualGraph ? (
            <div className="graph-workspace" aria-label="Interactive work graph visualization">
              <div className="graph-map">
                <svg className="graph-edge-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {visualGraph.edges.map((edge) => (
                    <line
                      key={edge.id}
                      x1={edge.source.x}
                      y1={edge.source.y}
                      x2={edge.target.x}
                      y2={edge.target.y}
                      className={edge.exceptionRate > 0 ? "graph-edge exception" : "graph-edge"}
                    />
                  ))}
                </svg>
                {visualGraph.edges.map((edge) => (
                  <span
                    key={`${edge.id}-label`}
                    className="graph-edge-label"
                    style={{
                      left: `${(edge.source.x + edge.target.x) / 2}%`,
                      top: `${(edge.source.y + edge.target.y) / 2}%`
                    }}
                  >
                    {edge.label}
                  </span>
                ))}
                {visualGraph.nodes.map(({ node, x, y }) => (
                  <button
                    key={node.id}
                    type="button"
                    className="graph-visual-node"
                    data-kind={node.kind}
                    data-risk={node.riskLevel}
                    aria-label={`Select graph node ${node.label}, ${node.kind}, ${node.riskLevel} risk, ${node.count} cases`}
                    aria-pressed={node.id === selectedGraphNode?.id}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => actions.selectGraphNode(node.id)}
                  >
                    <span>{node.kind}</span>
                    <strong>{node.label}</strong>
                    <small>{node.count} cases</small>
                  </button>
                ))}
              </div>
              <div className="graph-legend" aria-label="Graph risk legend">
                <span data-risk="low">Low risk</span>
                <span data-risk="medium">Medium risk</span>
                <span data-risk="high">High risk</span>
              </div>
            </div>
          ) : null}
          <div className="inspection-grid">
            <div className="graph-list" role="list" aria-label="Work graph nodes">
              {graph.nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={node.id === selectedGraphNode?.id ? "selected" : undefined}
                  aria-pressed={node.id === selectedGraphNode?.id}
                  onClick={() => actions.selectGraphNode(node.id)}
                >
                  <strong>{node.label}</strong>
                  <span>
                    {node.count} cases · {node.kind} · {node.riskLevel} risk
                  </span>
                </button>
              ))}
            </div>
            {selectedGraphNode ? (
              <article className="detail-card">
                <h3>{selectedGraphNode.label}</h3>
                <p>{graphNodeAuditRelevance(selectedGraphNode.kind, scenario.label, topBottleneck?.evidence)}</p>
                <dl>
                  <div>
                    <dt>Risk</dt>
                    <dd>{selectedGraphNode.riskLevel}</dd>
                  </div>
                  <div>
                    <dt>Cases</dt>
                    <dd>{selectedGraphNode.count}</dd>
                  </div>
                  <div>
                    <dt>Delay</dt>
                    <dd>
                      {selectedGraphNode.kind === "approval"
                        ? `${graph.metrics.approvalDelayHours}h approval delay`
                        : `${graph.metrics.averageCycleTimeHours}h cycle time`}
                    </dd>
                  </div>
                  <div>
                    <dt>Exception rate</dt>
                    <dd>{Math.round(graph.metrics.exceptionRate * 100)}%</dd>
                  </div>
                </dl>
                <h4>Related evidence</h4>
                <ul>
                  {selectedGraphEdges.length ? (
                    selectedGraphEdges.map((edge) => (
                      <li key={edge.id}>
                        <strong>{edge.label}</strong> · {edge.count} links · {edge.averageDurationHours}h avg ·{" "}
                        {Math.round(edge.exceptionRate * 100)}% exceptions
                      </li>
                    ))
                  ) : (
                    <li>No direct edges recorded for this node.</li>
                  )}
                </ul>
                <p className="detail-footnote">
                  Audit relevance:{" "}
                  {selectedGraphNode.kind === "approval"
                    ? "Approval timing and approvals are included in audit events."
                    : selectedGraphNode.kind === "exception"
                      ? "Exceptions carry into the audit trail and recommendation loop."
                      : "Node is part of the deterministic graph used for audit-ready replay."}
                </p>
              </article>
            ) : null}
          </div>
        </section>
      ) : (
        <EmptyState title="No graph generated" action="Load Scenario, then Analyze to build the work graph." />
      )}

      {patternDetection ? (
        <section className="pattern-panel" aria-label="Detected work patterns">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Pattern detection</p>
              <h2>Repeated workflows and automation opportunities</h2>
            </div>
            {selectedOpportunity ? (
              <strong className="opportunity-score">{Math.round(selectedOpportunity.score * 100)} opportunity</strong>
            ) : null}
          </div>
          <div className="inspection-grid">
            <div className="pattern-list" role="list" aria-label="Detected workflow patterns">
              {patternDetection.patterns.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  className={pattern.id === selectedPattern?.id ? "selected" : undefined}
                  aria-pressed={pattern.id === selectedPattern?.id}
                  onClick={() => actions.selectPattern(pattern.id)}
                >
                  <strong>{pattern.label}</strong>
                  <span>
                    {pattern.volume} cases · {Math.round(pattern.repeatabilityScore * 100)} repeatability ·{" "}
                    {pattern.riskLevel} risk
                  </span>
                </button>
              ))}
            </div>
            {selectedPattern ? (
              <article className="detail-card">
                <h3>{selectedPattern.label}</h3>
                <p>{selectedBottleneck?.evidence}</p>
                <dl>
                  <div>
                    <dt>Volume</dt>
                    <dd>{selectedPattern.volume}</dd>
                  </div>
                  <div>
                    <dt>Repeatability</dt>
                    <dd>{Math.round(selectedPattern.repeatabilityScore * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Opportunity</dt>
                    <dd>{Math.round((selectedOpportunity?.score ?? 0) * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Risk</dt>
                    <dd>{selectedPattern.riskLevel}</dd>
                  </div>
                </dl>
                <h4>Score drivers</h4>
                <ul>
                  <li>Delay: {Math.round((selectedOpportunity?.scoreComponents.delay ?? 0) * 100)}%</li>
                  <li>Volume: {Math.round((selectedOpportunity?.scoreComponents.volume ?? 0) * 100)}%</li>
                  <li>Repeatability: {Math.round((selectedOpportunity?.scoreComponents.repeatability ?? 0) * 100)}%</li>
                  <li>Risk adjustment: {Math.round((selectedOpportunity?.scoreComponents.riskAdjustment ?? 0) * 100)}%</li>
                </ul>
                <p className="detail-footnote">Representative cases: {selectedPattern.representativeCaseIds.join(", ")}</p>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
