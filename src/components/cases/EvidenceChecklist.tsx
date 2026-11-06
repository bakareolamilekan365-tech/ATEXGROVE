"use client";

import { useState } from "react";
import { EvidenceUploadForm } from "@/components/cases/EvidenceUploadForm";
import { evidenceTypeLabels, evidenceTypes } from "@/lib/case-evidence/validation";
import type { CaseEvidence } from "@/types/verification";
import styles from "./case-workflow.module.css";

const guidance: Record<(typeof evidenceTypes)[number], string> = {
  title_deed_copy: "May help reviewers understand the document you say relates to the land.",
  survey_plan_copy: "May help identify the site location and stated boundaries.",
  receipt: "May provide context about a reported transaction or payment.",
  seller_id: "May help identify the person named as the seller in your materials.",
  other: "Use this for other relevant, synthetic or redacted supporting material.",
};

export function EvidenceChecklist({ caseId, evidence }: Readonly<{ caseId: string; evidence: CaseEvidence[] }>) {
  const [selectedType, setSelectedType] = useState<(typeof evidenceTypes)[number] | null>(null);
  const existing = evidence.map((item) => ({ id: item.id, evidenceType: item.evidence_type, version: item.version, filename: item.original_filename, supersedesEvidenceId: item.supersedes_evidence_id }));
  return <div className={styles.stack}>
    <p className={styles.muted}>Not every case needs every document. Uploads are saved privately until you submit your request or response.</p>
    <ul className={styles.stack}>
      {evidenceTypes.map((type) => {
        const count = evidence.filter((item) => item.evidence_type === type).length;
        const selected = selectedType === type;
        return <li className={`${styles.card} ${selected ? styles.evidenceSelected : ""}`} key={type}>
          <div className={styles.cardHeader}><strong>{evidenceTypeLabels[type]}</strong><span>{selected ? "Selected" : `${count} supplied`}</span></div>
          <p className={styles.muted}>{guidance[type]}</p>
          <button className={styles.button} type="button" aria-expanded={selected} aria-controls={`evidence-upload-${type}`} onClick={() => setSelectedType(selected ? null : type)}>{selected ? "Close upload form" : "Add document"}</button>
          {selected ? <div id={`evidence-upload-${type}`} className={styles.evidenceInlineForm}><EvidenceUploadForm key={type} caseId={caseId} existingEvidence={existing} defaultEvidenceType={type} /></div> : null}
        </li>;
      })}
    </ul>
  </div>;
}
