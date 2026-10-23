"use client";

import { useFormStatus } from "react-dom";
import {
  cancelVerificationCaseAction,
  discardDraftCaseAction,
  submitDraftCaseAction,
} from "@/app/dashboard/cases/[id]/actions";
import styles from "./case-workflow.module.css";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import type { VerificationCaseStatus } from "@/types/verification";

function PendingButton({ children, pendingLabel }: Readonly<{ children: React.ReactNode; pendingLabel: string }>) {
  const { pending } = useFormStatus();
  return <button className={styles.button} type="submit" disabled={pending}>{pending ? pendingLabel : children}</button>;
}

export function CustomerCaseControls({ caseId, status }: Readonly<{ caseId: string; status: VerificationCaseStatus }>) {
  const actions = customerCaseActions(status);
  if (actions.canSubmitDraft && actions.canDiscardDraft) return (
    <section className={styles.panel} aria-labelledby="draft-actions-title">
      <h2 id="draft-actions-title">Finish this request</h2>
      <p className={styles.muted}>Staff cannot see this draft or its documents until you submit it.</p>
      <div className={styles.actions}>
        <form action={submitDraftCaseAction}><input type="hidden" name="caseId" value={caseId} /><PendingButton pendingLabel="Submitting...">Submit request</PendingButton></form>
        <form action={discardDraftCaseAction} onSubmit={(event) => {
          if (!window.confirm("Discard this draft? Its uploaded documents will be kept privately.")) event.preventDefault();
        }}><input type="hidden" name="caseId" value={caseId} /><PendingButton pendingLabel="Discarding...">Discard draft</PendingButton></form>
      </div>
    </section>
  );

  if (!actions.canCancel) return null;
  return (
    <section className={styles.panel} aria-labelledby="cancel-request-title">
      <h2 id="cancel-request-title">Cancel request</h2>
      <p className={styles.muted}>Cancelling stops the review. Any uploaded documents are retained privately.</p>
      <form action={cancelVerificationCaseAction} onSubmit={(event) => {
        if (!window.confirm("Cancel this request? This cannot be undone.")) event.preventDefault();
      }} className={styles.form}>
        <input type="hidden" name="caseId" value={caseId} />
        <label htmlFor="cancellationReason">Reason (optional)</label>
        <textarea id="cancellationReason" name="reason" maxLength={2000} rows={3} />
        <PendingButton pendingLabel="Cancelling...">Cancel request</PendingButton>
      </form>
    </section>
  );
}
