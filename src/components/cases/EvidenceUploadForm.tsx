"use client";

import { useActionState, useMemo, useState } from "react";
import {
  uploadCaseEvidenceAction,
  type EvidenceActionState,
} from "@/app/dashboard/cases/[id]/actions";
import { evidenceTypeLabels, evidenceTypes } from "@/lib/case-evidence/validation";
import { latestReplaceableEvidence } from "@/lib/case-evidence/versioning";
import type { CaseEvidence } from "@/types/verification";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: EvidenceActionState = { error: null, success: null };

type ExistingEvidenceOption = {
  id: string;
  evidenceType: keyof typeof evidenceTypeLabels;
  version: number;
  filename: string;
  supersedesEvidenceId: string | null;
};

export function EvidenceUploadForm({
  caseId,
  existingEvidence,
  defaultEvidenceType,
}: Readonly<{ caseId: string; existingEvidence: ExistingEvidenceOption[]; defaultEvidenceType?: (typeof evidenceTypes)[number] }>) {
  const [state, action] = useActionState(uploadCaseEvidenceAction, initialState);
  const [evidenceType, setEvidenceType] = useState<(typeof evidenceTypes)[number] | "">(defaultEvidenceType ?? "");
  const [uploadMode, setUploadMode] = useState<"new" | "replacement">("new");
  const [predecessorId, setPredecessorId] = useState("");
  const replacementOptions = useMemo(
    () => evidenceType === "" ? [] : latestReplaceableEvidence(
      existingEvidence.map((item) => ({
        id: item.id,
        evidence_type: item.evidenceType,
        version: item.version,
        original_filename: item.filename,
        supersedes_evidence_id: item.supersedesEvidenceId,
      })) as Pick<CaseEvidence, "id" | "evidence_type" | "version" | "original_filename" | "supersedes_evidence_id">[],
      evidenceType,
    ),
    [existingEvidence, evidenceType],
  );

  function changeEvidenceType(value: string) {
    if (value === "") {
      setEvidenceType("");
      setPredecessorId("");
      setUploadMode("new");
      return;
    }
    if (evidenceTypes.includes(value as (typeof evidenceTypes)[number])) {
      const selectedType = value as (typeof evidenceTypes)[number];
      const replacedIds = new Set(existingEvidence.map((item) => item.supersedesEvidenceId).filter((id): id is string => id !== null));
      const hasCurrentVersion = existingEvidence.some((item) => item.evidenceType === selectedType && !replacedIds.has(item.id));
      setEvidenceType(selectedType);
      setPredecessorId("");
      if (!hasCurrentVersion) setUploadMode("new");
    }
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="caseId" value={caseId} />
      <div className={styles.field}>
        <label htmlFor="evidenceType">Document type</label>
        <select id="evidenceType" name="evidenceType" required value={evidenceType} onChange={(event) => changeEvidenceType(event.target.value)}>
          {!defaultEvidenceType ? <option value="" disabled>Select a document type</option> : null}
          {evidenceTypes.map((type) => <option key={type} value={type}>{evidenceTypeLabels[type]}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="evidenceDescription">Short description</label>
        <input id="evidenceDescription" name="description" minLength={2} maxLength={500} required />
      </div>
      <fieldset className={styles.fieldset}>
        <legend>Upload type</legend>
        <label>
          <input type="radio" name="uploadMode" value="new" checked={uploadMode === "new"} onChange={() => { setUploadMode("new"); setPredecessorId(""); }} />
          <span><strong>New document</strong> — a separate record starting at Version 1</span>
        </label>
        <label>
          <input type="radio" name="uploadMode" value="replacement" checked={uploadMode === "replacement"} disabled={replacementOptions.length === 0} onChange={() => setUploadMode("replacement")} />
          <span><strong>Replacement version</strong> — link a corrected file to the latest version</span>
        </label>
      </fieldset>
      {uploadMode === "replacement" ? (
        <div className={styles.field}>
          <label htmlFor="supersedesEvidenceId">Choose the document version being replaced</label>
          <select id="supersedesEvidenceId" value={predecessorId} required onChange={(event) => setPredecessorId(event.target.value)}>
            <option value="" disabled>Select the latest version</option>
            {replacementOptions.map((document) => (
              <option key={document.id} value={document.id}>
                {evidenceTypeLabels[document.evidence_type]} — Version {document.version} · {document.original_filename}
              </option>
            ))}
          </select>
          <input type="hidden" name="supersedesEvidenceId" value={predecessorId} />
          <span className={`${styles.muted} ${styles.small}`}>Earlier versions stay in the case history.</span>
        </div>
      ) : <input type="hidden" name="supersedesEvidenceId" value="" />}
      <div className={styles.field}>
        <label htmlFor="evidenceFile">PDF, JPG or PNG (maximum 10 MB)</label>
        <input id="evidenceFile" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
      </div>
      <div className={styles.notice}>Synthetic or properly redacted files only. Saved privately — not yet submitted to the review team.</div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <SubmitButton pendingLabel="Uploading...">Add document</SubmitButton>
    </form>
  );
}
