"use client";

import { useActionState, useRef, useState } from "react";
import {
  createVerificationCaseAction,
  type CaseFormState,
} from "@/app/dashboard/cases/actions";
import { SubmitButton } from "./SubmitButton";
import styles from "./case-workflow.module.css";
import { fctAreaCouncils, fctLocationsDisclaimer, listedAreasFor } from "@/lib/verification-cases/abuja-locations";

const initialState: CaseFormState = { error: null };

export function NewCaseForm({ idempotencyKey }: Readonly<{ idempotencyKey: string }>) {
  const idempotencyKeyRef = useRef(idempotencyKey);
  const [council, setCouncil] = useState("");
  const [areaIsListed, setAreaIsListed] = useState(true);
  const [contactPreference, setContactPreference] = useState("email");
  const [state, action] = useActionState(
    createVerificationCaseAction,
    initialState,
  );

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKeyRef.current} />
      <div className={styles.field}>
        <label htmlFor="areaLga">FCT area council</label>
        <input
          id="areaLga"
          name="areaLga"
          list="fct-councils"
          value={council}
          onChange={(event) => { setCouncil(event.target.value); setAreaIsListed(true); }}
          placeholder="Choose one of the six FCT councils"
          required
        />
        <datalist id="fct-councils">{fctAreaCouncils.map(({ name }) => <option key={name} value={name} />)}</datalist>
        <p className={styles.muted}>{fctLocationsDisclaimer}</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="areaName">Area</label>
        {areaIsListed ? <input id="areaName" name="areaName" list="fct-areas" placeholder="Choose an area" required /> : <input id="areaName" name="areaName" placeholder="Type your area" minLength={2} maxLength={120} required />}
        <datalist id="fct-areas">{listedAreasFor(council).map((area) => <option key={area} value={area} />)}</datalist>
        <label className={styles.checkbox}><input type="checkbox" checked={!areaIsListed} onChange={(event) => setAreaIsListed(!event.target.checked)} /> My area isn&apos;t listed</label>
        <input type="hidden" name="areaIsListed" value={String(areaIsListed)} />
      </div>

      <div className={styles.field}>
        <label htmlFor="addressLine">Address details</label>
        <textarea id="addressLine" name="addressLine" minLength={3} maxLength={500} rows={3} required />
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
        <label><input type="radio" name="contactPreference" value="email" checked={contactPreference === "email"} onChange={() => setContactPreference("email")} /> Email</label>
        <label><input type="radio" name="contactPreference" value="phone" checked={contactPreference === "phone"} onChange={() => setContactPreference("phone")} /> Phone</label>
        <label><input type="radio" name="contactPreference" value="whatsapp" checked={contactPreference === "whatsapp"} onChange={() => setContactPreference("whatsapp")} /> WhatsApp</label>
      </fieldset>
      {contactPreference !== "email" ? <>
        <div className={styles.field}><label htmlFor="contactPhone">Nigerian mobile number</label><input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" placeholder="080... or +234..." required /></div>
        <label className={styles.checkbox}><input name="contactPhoneConsent" type="checkbox" /> So the review team can reach you about this request.</label>
      </> : <><input type="hidden" name="contactPhone" value="" /><input type="hidden" name="contactPhoneConsent" value="false" /></>}

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
