import { Download, Upload } from "lucide-react";
import { SectionPanel } from "../../components/shared/SectionPanel";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface ReviewViewProps {
  controller: WorkGraphDemoController;
}

export function ReviewView({ controller }: ReviewViewProps) {
  const { actions, auditEvents, exportText, importError, importText } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Review</p>
        <h2>Audit, export, import, and recovery</h2>
      </section>

      <SectionPanel
        ariaLabel="Audit trail and execution summary"
        className="audit-panel"
        eyebrow="Audit trail"
        title="Persisted workflow state and reviewable agent behavior"
        actions={
          <div className="governance-actions">
            <button className="export-button" type="button" onClick={actions.exportSummary}>
              <Download size={16} />
              <span>Export Summary</span>
            </button>
            <button className="export-button" type="button" onClick={actions.importSummary} disabled={!importText.trim()}>
              <Upload size={16} />
              <span>Import Summary</span>
            </button>
          </div>
        }
      >
        <div className="audit-grid">
          <article>
            <h3>Audit events</h3>
            {auditEvents.length ? (
              auditEvents.map((event) => (
                <p key={event.id}>
                  <strong>{event.action}</strong> · {event.actor.replaceAll("_", " ")} · {event.detail}
                </p>
              ))
            ) : (
              <p>No execution events recorded. Load the workflow to begin the audit trail.</p>
            )}
          </article>
          <article>
            <h3>Execution summary export</h3>
            <textarea
              aria-label="Execution summary JSON"
              value={exportText}
              onChange={(event) => actions.setExportText(event.target.value)}
              placeholder="Exported execution summary JSON appears here."
            />
          </article>
          <article>
            <h3>Import summary</h3>
            <textarea
              aria-label="Import execution summary JSON"
              value={importText}
              onChange={(event) => actions.setImportText(event.target.value)}
              placeholder="Provide a Work Graph Foundry execution summary JSON to restore workflow state."
            />
            {importError ? (
              <p className="import-error" role="alert">
                {importError}
              </p>
            ) : null}
          </article>
        </div>
      </SectionPanel>
    </>
  );
}
