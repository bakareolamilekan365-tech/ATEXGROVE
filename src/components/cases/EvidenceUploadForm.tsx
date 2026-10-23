"use client";

import { useActionState } from "react";
import {
  uploadCaseEvidenceAction,
  type EvidenceActionState,
} from "@/app/dashboard/cases/[id]/actions";
import { evidenceTypeLabels, evidenceTypes } from "@/lib/case-evidence/validation";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: EvidenceActionState = { error: null, success: null };

type ExistingEvidenceOption = {
  id: string;
  evidenceType: keyof typeof evidenceTypeLabels;
  version: number;
  filename: string;
};

export function EvidenceUploadForm({
  caseId,
  existingEvidence,
  defaultEvidenceType,
}: Readonly<{ caseId: string; existingEvidence: ExistingEvidenceOption[]; defaultEvidenceType?: (typeof evidenceTypes)[number] }>) {
  const [state, action] = useActionState(uploadCaseEvidenceAction, initialState);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="caseId" value={caseId} />
      <div className={styles.field}>
        <label htmlFor="evidenceType">Document type</label>
        <select id="evidenceType" name="evidenceType" required defaultValue={defaultEvidenceType ?? ""}>
          {!defaultEvidenceType ? <option value="" disabled>Select a document type</option> : null}
          {evidenceTypes.map((type) => <option key={type} value={type}>{evidenceTypeLabels[type]}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="evidenceDescription">Short description</label>
        <input id="evidenceDescription" name="description" minLength={2} maxLength={500} required />
      </div>
      {existingEvidence.length ? (
        <div className={styles.field}>
          <label htmlFor="supersedesEvidenceId">Replaces an earlier file (optional)</label>
          <select id="supersedesEvidenceId" name="supersedesEvidenceId" defaultValue="">
            <option value="">No — add as a separate document</option>
            {existingEvidence.map((document) => (
              <option key={document.id} value={document.id}>
                {evidenceTypeLabels[document.evidenceType]} v{document.version} — {document.filename}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="evidenceFile">PDF, JPG or PNG (maximum 10 MB)</label>
        <input id="evidenceFile" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
      </div>
      <div className={styles.notice}>Synthetic or properly redacted files only. Received from customer — not authenticated.</div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <SubmitButton pendingLabel="Uploading...">Add document</SubmitButton>
    </form>
  );
}
