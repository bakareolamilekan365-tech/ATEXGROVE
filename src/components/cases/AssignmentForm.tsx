"use client";

import { useActionState } from "react";
import {
  assignVerificationCaseAction,
  type OpsActionState,
} from "@/app/ops/cases/actions";
import type { StaffMember } from "@/types/verification";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: OpsActionState = { error: null, success: null };

export function AssignmentForm({
  caseId,
  staff,
}: Readonly<{ caseId: string; staff: StaffMember[] }>) {
  const [state, action] = useActionState(
    assignVerificationCaseAction,
    initialState,
  );

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="caseId" value={caseId} />
      <div className={styles.field}>
        <label htmlFor="assigneeUserId">Assign to</label>
        <select id="assigneeUserId" name="assigneeUserId" required defaultValue="">
          <option value="" disabled>Select an active team member</option>
          {staff.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user_id.slice(0, 8)} · {member.department}{member.is_lead ? " · Lead" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="assignmentNote">Assignment note</label>
        <textarea id="assignmentNote" name="note" minLength={2} maxLength={2000} rows={3} required />
      </div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.success} role="status">{state.success}</p> : null}
      <SubmitButton pendingLabel="Assigning...">Assign case</SubmitButton>
    </form>
  );
}
