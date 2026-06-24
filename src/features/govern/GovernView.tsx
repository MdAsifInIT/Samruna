import { ShieldCheck, XCircle } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface GovernViewProps {
  controller: WorkGraphDemoController;
}

export function GovernView({ controller }: GovernViewProps) {
  const {
    actions,
    demoState,
    executionGateLabel,
    executionReady,
    governanceDecisionLabel,
    proposal,
    simulation,
    simulationCasePreview
  } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Govern</p>
        <h2>Simulation, compliance, and approval</h2>
      </section>

      {simulation && proposal ? (
        <section className="simulation-panel" aria-label="Simulation and governance">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Simulation and governance</p>
              <h2>Governance-gated replay before execution</h2>
            </div>
            <div className="governance-actions">
              <button className="approve-button" type="button" disabled={!proposal} onClick={actions.approveProposal}>
                <ShieldCheck size={16} />
                <span>{demoState.governanceDecision === "approved" ? "Approved" : "Approve"}</span>
              </button>
              <button className="reject-button" type="button" disabled={!proposal} onClick={actions.rejectProposal}>
                <XCircle size={16} />
                <span>{demoState.governanceDecision === "rejected" ? "Rejected" : "Reject"}</span>
              </button>
            </div>
          </div>
          <div className="governance-summary" data-decision={demoState.governanceDecision}>
            <div>
              <span>Governance gate</span>
              <strong>{governanceDecisionLabel}</strong>
            </div>
            <div>
              <span>Approval gate</span>
              <strong>{executionReady ? "Open" : "Blocked"}</strong>
            </div>
            <div>
              <span>Policy context</span>
              <strong>{proposal.riskLevel} risk</strong>
            </div>
            <div>
              <span>Review version</span>
              <strong>v{proposal.version}</strong>
            </div>
          </div>
          <div className="simulation-grid">
            <article>
              <span>Pass</span>
              <strong>{simulation.passed}</strong>
            </article>
            <article>
              <span>Needs human</span>
              <strong>{simulation.needsHuman}</strong>
            </article>
            <article>
              <span>Policy risk</span>
              <strong>{simulation.policyRisk}</strong>
            </article>
            <article>
              <span>Execution gate</span>
              <strong>{executionGateLabel}</strong>
            </article>
            <article>
              <span>Avoided delay</span>
              <strong>{simulation.avoidedDelayHours}h</strong>
            </article>
          </div>
          <div className="simulation-case-preview" aria-label="Case-level simulation preview">
            {simulationCasePreview.map((caseResult) => (
              <article key={caseResult.caseId}>
                <span>{caseResult.caseId}</span>
                <strong>{caseResult.statusLabel}</strong>
                <p>{caseResult.reason}</p>
              </article>
            ))}
          </div>
          <div className="audit-log">
            <h3>Governance and security notes</h3>
            <p>
              <strong>Data access</strong> · Needs workflow metadata, timestamps, status changes, owners, approvals, comments if
              available, and system identifiers.
            </p>
            <p>
              <strong>Forbidden data</strong> · Does not need passwords, raw secrets, private message bodies, production write
              access, or unrestricted admin access.
            </p>
            <p>
              <strong>Approval rule</strong> · Execution opens only when an approved record exists for proposal version{" "}
              {proposal.version}.
            </p>
            <p>
              <strong>Safety boundary</strong> · Mock execution is deterministic, read-only to external systems, and limited to
              synthetic demo records.
            </p>
          </div>
        </section>
      ) : (
        <EmptyState title="Governance not ready" action="Generate Proposal to run simulation and open review controls." />
      )}
    </>
  );
}
