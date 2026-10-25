"use client";

import { useActionState } from "react";
import {
  transitionVerificationCaseAction,
  type OpsActionState,
} from "@/app/ops/cases/actions";
import { availableCaseTransitions, caseStatusLabels } from "@/lib/verification-cases/status";
import type { VerificationCaseStatus } from "@/types/verification";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: OpsActionState = { error: null, success: null };

export function StatusTransitionForm({
  caseId,
  currentStatus,
}: Readonly<{ caseId: string; currentStatus: VerificationCaseStatus }>) {
  const [state, action] = useActionState(
    transitionVerificationCaseAction,
    initialState,
  );
  const transitions = availableCaseTransitions(currentStatus);

  if (transitions.length === 0) {
    return <p className={styles.muted}>No further status moves are available.</p>;
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="caseId" value={caseId} />
      {currentStatus === "needs_customer_info" ? (
        <p className={styles.muted}>Waiting for the customer to submit their response. You may close or cancel this case; only the customer can resume review.</p>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="toStatus">New status</label>
        <select id="toStatus" name="toStatus" required defaultValue="">
          <option value="" disabled>Select the next status</option>
          {transitions.map((status) => (
            <option key={status} value={status}>{caseStatusLabels[status]}</option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="staffNote">Internal staff note</label>
        <textarea id="staffNote" name="staffNote" minLength={2} maxLength={2000} rows={4} required />
        <span className={`${styles.muted} ${styles.small}`}>Staff only. This text is never shown to the customer.</span>
      </div>
      <div className={styles.field}>
        <label htmlFor="customerMessage">Customer message (optional)</label>
        <textarea id="customerMessage" name="customerMessage" maxLength={2000} rows={3} />
        <span className={`${styles.muted} ${styles.small}`}>The customer always receives a standard status update. Add only customer-safe context here.</span>
      </div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <SubmitButton pendingLabel="Updating...">Update status</SubmitButton>
    </form>
  );
}
