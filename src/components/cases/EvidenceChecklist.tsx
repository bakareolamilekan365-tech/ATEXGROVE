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
  const existing = evidence.map((item) => ({ id: item.id, evidenceType: item.evidence_type, version: item.version, filename: item.original_filename }));
  return <div className={styles.stack}>
    <p className={styles.muted}>Not every case needs every document. Uploads are received from customer — not authenticated.</p>
    <ul className={styles.stack}>
      {evidenceTypes.map((type) => {
        const count = evidence.filter((item) => item.evidence_type === type).length;
        return <li className={styles.card} key={type}>
          <div className={styles.cardHeader}><strong>{evidenceTypeLabels[type]}</strong><span>{count} supplied</span></div>
          <p className={styles.muted}>{guidance[type]}</p>
          <button className={styles.button} type="button" aria-expanded={selectedType === type} onClick={() => setSelectedType(selectedType === type ? null : type)}>Add</button>
        </li>;
      })}
    </ul>
    {selectedType ? <EvidenceUploadForm key={selectedType} caseId={caseId} existingEvidence={existing} defaultEvidenceType={selectedType} /> : null}
  </div>;
}
