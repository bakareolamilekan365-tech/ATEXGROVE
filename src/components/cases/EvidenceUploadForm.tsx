"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeCaseEvidenceUploadAction } from "@/app/dashboard/cases/[id]/actions";
import {
  uploadEvidenceDirectly,
  type EvidenceUploadResult,
} from "@/lib/case-evidence/direct-upload";
import { evidenceTypeLabels, evidenceTypes } from "@/lib/case-evidence/validation";
import { latestReplaceableEvidence } from "@/lib/case-evidence/versioning";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { CaseEvidence } from "@/types/verification";
import styles from "./case-workflow.module.css";

const initialState: EvidenceUploadResult = { error: null, success: null };

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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);
  const [state, setState] = useState(initialState);
  const [stage, setStage] = useState<"idle" | "uploading" | "finalizing">("idle");
  const [evidenceType, setEvidenceType] = useState<(typeof evidenceTypes)[number] | "">(defaultEvidenceType ?? "");
  const [uploadMode, setUploadMode] = useState<"new" | "replacement">("new");
  const [predecessorId, setPredecessorId] = useState("");
  const [selectedFilename, setSelectedFilename] = useState("");
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

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    form.focus({ preventScroll: true });
    form.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

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

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setState(initialState);

    try {
      const form = new FormData(event.currentTarget);
      const file = form.get("file");
      if (!(file instanceof File)) {
        setState({ error: "Choose a file to upload.", success: null });
        return;
      }

      setStage("uploading");
      const result = await uploadEvidenceDirectly(
        createSupabaseClient(),
        {
          caseId,
          evidenceType: String(form.get("evidenceType") ?? ""),
          description: String(form.get("description") ?? ""),
          supersedesEvidenceId: String(form.get("supersedesEvidenceId") ?? ""),
          file,
        },
        async (metadata) => {
          setStage("finalizing");
          return finalizeCaseEvidenceUploadAction(metadata);
        },
      );
      setState(result);
      if (result.success) router.refresh();
    } catch {
      setState({ error: "The document could not be saved. Check your connection and try again.", success: null });
    } finally {
      setStage("idle");
      inFlight.current = false;
    }
  }

  return (
    <form ref={formRef} tabIndex={-1} className={styles.form} onSubmit={submitEvidence} aria-label={`Add ${evidenceType === "" ? "case evidence" : evidenceTypeLabels[evidenceType]}`}>
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
        <input id="evidenceFile" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required onChange={(event) => setSelectedFilename(event.target.files?.[0]?.name ?? "")} />
        <span className={`${styles.muted} ${styles.small}`} role="status">{selectedFilename ? `Selected file: ${selectedFilename}` : "No file selected."}</span>
      </div>
      <div className={styles.notice}>Synthetic or properly redacted files only. Saved privately — not yet submitted to the review team.</div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <button type="submit" disabled={stage !== "idle"} aria-describedby={stage !== "idle" ? "evidence-upload-stage" : undefined}>
        {stage === "uploading" ? "Uploading..." : stage === "finalizing" ? "Validating and saving..." : "Add document"}
      </button>
      <span id="evidence-upload-stage" className="sr-only" aria-live="polite">{stage === "uploading" ? "Uploading document" : stage === "finalizing" ? "Validating and saving document" : ""}</span>
    </form>
  );
}
