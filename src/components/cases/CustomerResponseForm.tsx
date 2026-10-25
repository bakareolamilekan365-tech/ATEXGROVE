"use client";

import { useActionState } from "react";
import {
  customerRespondToCaseAction,
  type EvidenceActionState,
} from "@/app/dashboard/cases/[id]/actions";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: EvidenceActionState = { error: null, success: null };

export function CustomerResponseForm({ caseId, requestEventId }: Readonly<{ caseId: string; requestEventId: string }>) {
  const [state, action] = useActionState(customerRespondToCaseAction, initialState);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="requestEventId" value={requestEventId} />
      <div className={styles.field}>
        <label htmlFor="customerResponse">Your response</label>
        <textarea id="customerResponse" name="message" minLength={2} maxLength={2000} rows={4} required />
      </div>
      <p className={styles.muted}>Uploaded documents stay private until you submit this response. All pending files will be submitted together.</p>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <SubmitButton pendingLabel="Sending...">Submit response</SubmitButton>
    </form>
  );
}
