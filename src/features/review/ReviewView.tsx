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
        ariaLabel="Audit trail and run summary"
        className="audit-panel"
        eyebrow="Audit trail"
        title="Persisted demo state and reviewable agent behavior"
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
              <p>No run events yet. Load the scenario to begin the audit trail.</p>
            )}
          </article>
          <article>
            <h3>Run summary export</h3>
            <textarea
              aria-label="Run summary JSON"
              value={exportText}
              onChange={(event) => actions.setExportText(event.target.value)}
              placeholder="Exported run summary JSON appears here."
            />
          </article>
          <article>
            <h3>Import summary</h3>
            <textarea
              aria-label="Import run summary JSON"
              value={importText}
              onChange={(event) => actions.setImportText(event.target.value)}
              placeholder="Paste a Work Graph Foundry run summary JSON to restore a demo state."
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
