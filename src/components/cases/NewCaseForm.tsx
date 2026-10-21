"use client";

import { useActionState, useRef } from "react";
import {
  createVerificationCaseAction,
  type CaseFormState,
} from "@/app/dashboard/cases/actions";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";

const initialState: CaseFormState = { error: null };

export function NewCaseForm({ idempotencyKey }: Readonly<{ idempotencyKey: string }>) {
  const idempotencyKeyRef = useRef(idempotencyKey);
  const [state, action] = useActionState(
    createVerificationCaseAction,
    initialState,
  );

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKeyRef.current} />
      <div className={styles.field}>
        <label htmlFor="areaLga">Area or LGA in Abuja</label>
        <input
          id="areaLga"
          name="areaLga"
          placeholder="For example, Kuje"
          minLength={2}
          maxLength={120}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="siteDescription">Plot description</label>
        <textarea
          id="siteDescription"
          name="siteDescription"
          placeholder="Describe the plot and how it can be identified. Do not include sensitive documents here."
          minLength={10}
          maxLength={2000}
          rows={5}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="notes">Additional notes</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Optional context for the verification team"
          maxLength={4000}
          rows={4}
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Preferred contact method</legend>
        <label><input type="radio" name="contactPreference" value="email" defaultChecked /> Email</label>
        <label><input type="radio" name="contactPreference" value="phone" /> Phone</label>
        <label><input type="radio" name="contactPreference" value="whatsapp" /> WhatsApp</label>
      </fieldset>

      <div className={styles.notice}>
        This controlled pilot uses synthetic or properly redacted information only.
        Submitting a request does not verify the land or create a legal conclusion.
      </div>

      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      <SubmitButton pendingLabel="Submitting request...">Submit request</SubmitButton>
      <p className={styles.muted}>Atexgrove is a demo prototype. Use test details only and don&apos;t enter real land documents or sensitive personal data. A full privacy policy will be published before real use.</p>
    </form>
  );
}
