"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  cancelVerificationCaseAction,
  discardDraftCaseAction,
  submitDraftCaseAction,
} from "@/app/dashboard/cases/[id]/actions";
import styles from "./case-workflow.module.css";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import { CASE_SERVICE_SCOPE_NOTICE, CASE_SERVICE_SCOPE_NOTICE_VERSION } from "@/lib/verification-cases/service-scope-notice";
import type { VerificationCaseStatus } from "@/types/verification";

const initialState = { error: null as string | null };

function PendingButton({ children, pendingLabel }: Readonly<{ children: React.ReactNode; pendingLabel: string }>) {
  const { pending } = useFormStatus();
  return <button className={styles.button} type="submit" disabled={pending}>{pending ? pendingLabel : children}</button>;
}

export function CustomerCaseControls({ caseId, status }: Readonly<{ caseId: string; status: VerificationCaseStatus }>) {
  const actions = customerCaseActions(status);
  if (actions.canSubmitDraft && actions.canDiscardDraft) return <DraftCaseControls caseId={caseId} />;

  if (!actions.canCancel) return null;
  return <CancelCaseControls caseId={caseId} />;
}

function DraftCaseControls({ caseId }: Readonly<{ caseId: string }>) {
  const [submitState, submitAction] = useActionState(submitDraftCaseAction, initialState);
  const [discardState, discardAction] = useActionState(discardDraftCaseAction, initialState);
  return (
    <section className={styles.panel} aria-labelledby="draft-actions-title">
      <h2 id="draft-actions-title">Finish this request</h2>
      <p className={styles.muted}>Your request is saved to your account. Staff cannot see it or its documents until you submit it.</p>
      <div className={styles.actions}>
        <form action={submitAction} className={styles.form}>
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="noticeVersion" value={CASE_SERVICE_SCOPE_NOTICE_VERSION} />
          <div className={styles.notice}><strong>Draft wording, not legally reviewed.</strong><br />{CASE_SERVICE_SCOPE_NOTICE}</div>
          <label className={styles.checkbox}><input name="serviceScopeAccepted" type="checkbox" required /> I have read and accept this service-scope notice.</label>
          {submitState.error ? <p className={styles.error} role="alert">{submitState.error}</p> : null}
          <PendingButton pendingLabel="Submitting...">Submit request</PendingButton>
        </form>
        <form action={discardAction} className={styles.form} onSubmit={(event) => {
          if (!window.confirm("Discard this draft? Its uploaded documents will be kept privately.")) event.preventDefault();
        }}><input type="hidden" name="caseId" value={caseId} />{discardState.error ? <p className={styles.error} role="alert">{discardState.error}</p> : null}<PendingButton pendingLabel="Discarding...">Discard draft</PendingButton></form>
      </div>
    </section>
  );
}

function CancelCaseControls({ caseId }: Readonly<{ caseId: string }>) {
  const [state, action] = useActionState(cancelVerificationCaseAction, initialState);
  return (
    <section className={styles.panel} aria-labelledby="cancel-request-title">
      <h2 id="cancel-request-title">Cancel request</h2>
      <p className={styles.muted}>Cancelling stops the review. Any uploaded documents are retained privately.</p>
      <form action={action} onSubmit={(event) => {
        if (!window.confirm("Cancel this request? This cannot be undone.")) event.preventDefault();
      }} className={styles.form}>
        <input type="hidden" name="caseId" value={caseId} />
        <label htmlFor="cancellationReason">Reason (optional)</label>
        <textarea id="cancellationReason" name="reason" maxLength={2000} rows={3} />
        {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
        <PendingButton pendingLabel="Cancelling...">Cancel request</PendingButton>
      </form>
    </section>
  );
}
