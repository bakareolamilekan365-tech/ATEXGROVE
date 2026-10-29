"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createVerificationCaseAction, type CaseFormState } from "@/app/dashboard/cases/actions";
import { Select, type SelectOption } from "@/components/ui/Select";
import { fctAreaCouncils, fctLocationsDisclaimer, listedAreasFor } from "@/lib/verification-cases/abuja-locations";
import { SubmitButton } from "./SubmitButton";
import { shouldSuggestDeveloperRelationship } from "@/lib/verification-cases/intake-labels";
import {
  clearDraftRecovery,
  createStoredCaseDraft,
  draftRecoveryKey,
  hasRecoverableCaseDraft,
  parseStoredCaseDraft,
  type RecoverableCaseDraft,
} from "@/lib/verification-cases/draft-recovery";
import styles from "./case-workflow.module.css";

const initialState: CaseFormState = { error: null };
const councilOptions: SelectOption[] = fctAreaCouncils.map(({ name }) => ({ value: name, label: name }));
type Values = { areaLga: string; areaName: string; areaIsListed: boolean; addressLine: string; siteDescription: string; notes: string; contactPreference: string; contactPhone: string; contactPhoneConsent: boolean; customerIntent: string; relationshipToLand: string; actingFor: string; principalName: string; authorityConfirmed: boolean };
const emptyValues: Values = { areaLga: "", areaName: "", areaIsListed: true, addressLine: "", siteDescription: "", notes: "", contactPreference: "email", contactPhone: "", contactPhoneConsent: false, customerIntent: "", relationshipToLand: "", actingFor: "self", principalName: "", authorityConfirmed: false };

export function NewCaseForm({ idempotencyKey, userId }: Readonly<{ idempotencyKey: string; userId: string }>) {
  const idempotencyKeyRef = useRef(idempotencyKey);
  const [values, setValues] = useState<Values>(emptyValues);
  const [recoveryCandidate, setRecoveryCandidate] = useState<RecoverableCaseDraft | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [deviceSaveState, setDeviceSaveState] = useState<"saved" | "failed" | null>(null);
  const editedRef = useRef(false);
  const [state, action] = useActionState(createVerificationCaseAction, initialState);
  const errors = state.fieldErrors ?? {};
  const areaOptions = listedAreasFor(values.areaLga).map((area) => ({ value: area, label: area }));

  useEffect(() => {
    if (state.values) {
      setValues({
        areaLga: state.values.areaLga ?? "", areaName: state.values.areaName ?? "",
        areaIsListed: state.values.areaIsListed !== "false", addressLine: state.values.addressLine ?? "",
        siteDescription: state.values.siteDescription ?? "", notes: state.values.notes ?? "",
        contactPreference: state.values.contactPreference ?? "email", contactPhone: state.values.contactPhone ?? "",
        contactPhoneConsent: state.values.contactPhoneConsent === "on",
        customerIntent: state.values.customerIntent ?? "", relationshipToLand: state.values.relationshipToLand ?? "",
        actingFor: state.values.actingFor ?? "self", principalName: state.values.principalName ?? "",
        authorityConfirmed: state.values.authorityConfirmed === "on",
      });
    }
    if (state.firstInvalidField) document.getElementById(state.firstInvalidField)?.focus();
  }, [state]);

  useEffect(() => {
    try {
      const key = draftRecoveryKey(userId);
      const raw = window.localStorage.getItem(key);
      const recovered = parseStoredCaseDraft(raw);
      if (raw && !recovered) window.localStorage.removeItem(key);
      if (recovered) setRecoveryCandidate(recovered);
      else setRecoveryReady(true);
    } catch {
      setRecoveryReady(true);
      setDeviceSaveState("failed");
    }
  }, [userId]);

  useEffect(() => {
    if (!recoveryReady || !editedRef.current) return;
    const recoverable: RecoverableCaseDraft = {
      customerIntent: values.customerIntent,
      relationshipToLand: values.relationshipToLand,
      areaLga: values.areaLga,
      areaName: values.areaName,
      areaIsListed: values.areaIsListed,
      siteDescription: values.siteDescription,
    };
    const timeout = window.setTimeout(() => {
      try {
        if (hasRecoverableCaseDraft(recoverable)) {
          window.localStorage.setItem(
            draftRecoveryKey(userId),
            JSON.stringify(createStoredCaseDraft(recoverable)),
          );
          setDeviceSaveState("saved");
        } else {
          clearDraftRecovery(window.localStorage, userId);
          setDeviceSaveState(null);
        }
      } catch {
        setDeviceSaveState("failed");
      }
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [
    recoveryReady,
    userId,
    values.areaIsListed,
    values.areaLga,
    values.areaName,
    values.customerIntent,
    values.relationshipToLand,
    values.siteDescription,
  ]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    editedRef.current = true;
    setValues((current) => ({ ...current, [key]: value }));
  }
  function restoreRecovery() {
    if (!recoveryCandidate) return;
    setValues((current) => ({ ...current, ...recoveryCandidate }));
    setRecoveryCandidate(null);
    setRecoveryReady(true);
    setDeviceSaveState("saved");
  }
  function discardRecovery() {
    try {
      clearDraftRecovery(window.localStorage, userId);
    } catch {
      // The form remains usable when browser storage is unavailable.
    }
    setRecoveryCandidate(null);
    setRecoveryReady(true);
    setDeviceSaveState(null);
  }
  function fieldError(id: string, message?: string) { return message ? <p className={styles.error} id={`${id}-error`}>{message}</p> : null; }
  function described(helpId: string, error?: string) { return error ? `${helpId} ${helpId.replace("-help", "-error")}` : helpId; }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKeyRef.current} />
      {recoveryCandidate ? (
        <div className={styles.recoveryPrompt} role="status">
          <div>
            <strong>Continue your unsaved request?</strong>
            <p>We found request details saved on this device within the last 7 days.</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={restoreRecovery}>Restore details</button>
            <button className={styles.buttonSecondary} type="button" onClick={discardRecovery}>Discard device copy</button>
          </div>
        </div>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="customerIntent">What are you asking us to help with?</label>
        <select id="customerIntent" name="customerIntent" value={values.customerIntent} onChange={(event) => update("customerIntent", event.target.value)} required aria-invalid={Boolean(errors.customerIntent) || undefined}>
          <option value="" disabled>Choose one</option>
          <option value="buying">Buying land</option><option value="own_or_occupy">I own or occupy the land</option>
          <option value="developing">Developing the land</option><option value="representing_someone">Representing someone</option><option value="other">Other</option>
        </select>
        {fieldError("customerIntent", errors.customerIntent)}
      </div>

      <div className={styles.field}>
        <label htmlFor="relationshipToLand">What is your relationship to the land?</label>
        <select id="relationshipToLand" name="relationshipToLand" value={values.relationshipToLand} onChange={(event) => update("relationshipToLand", event.target.value)} required aria-invalid={Boolean(errors.relationshipToLand) || undefined}>
          <option value="" disabled>Choose one</option><option value="buyer">Buyer</option><option value="owner">Owner</option>
          <option value="occupier">Occupier</option><option value="developer">Developer</option><option value="agent_or_representative">Agent or representative</option><option value="other">Other</option>
        </select>
        <p className={styles.muted}>This is your claim about your relationship, not proof of ownership.</p>
        {shouldSuggestDeveloperRelationship(values.customerIntent, values.relationshipToLand) ? (
          <p className={styles.contextHint} role="note">
            Developer may fit this request, but choose the relationship that accurately describes you. Owner and Occupier remain valid options.
          </p>
        ) : null}
        {fieldError("relationshipToLand", errors.relationshipToLand)}
      </div>

      <div className={styles.field}>
        <label htmlFor="actingFor">Who is this request for?</label>
        <select id="actingFor" name="actingFor" value={values.actingFor} onChange={(event) => { update("actingFor", event.target.value); update("principalName", ""); update("authorityConfirmed", false); }} required aria-invalid={Boolean(errors.actingFor) || undefined}>
          <option value="self">Myself</option><option value="another_person">Another person</option><option value="organisation">An organisation</option>
        </select>
        {values.actingFor !== "self" ? <>
          <label htmlFor="principalName">Person or organisation name</label>
          <input id="principalName" name="principalName" value={values.principalName} onChange={(event) => update("principalName", event.target.value)} maxLength={200} required aria-invalid={Boolean(errors.principalName) || undefined} />
          {fieldError("principalName", errors.principalName)}
          <label className={styles.checkbox}><input name="authorityConfirmed" type="checkbox" checked={values.authorityConfirmed} onChange={(event) => update("authorityConfirmed", event.target.checked)} aria-invalid={Boolean(errors.authorityConfirmed) || undefined} /> I confirm I am authorised to submit this request on their behalf</label>
          {fieldError("authorityConfirmed", errors.authorityConfirmed)}
        </> : <input type="hidden" name="principalName" value="" />}
        {values.actingFor === "self" ? <input type="hidden" name="authorityConfirmed" value="false" /> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="areaLga">FCT area council</label>
        <Select id="areaLga" name="areaLga" label="FCT area council" options={councilOptions} value={values.areaLga}
          onChange={(areaLga) => { editedRef.current = true; setValues((current) => ({ ...current, areaLga, areaName: "", areaIsListed: true })); }}
          required describedBy={described("areaLga-help", errors.areaLga)} error={Boolean(errors.areaLga)} />
        <p className={styles.muted} id="areaLga-help">{fctLocationsDisclaimer}</p>
        {fieldError("areaLga", errors.areaLga)}
      </div>

      <div className={styles.field}>
        <label htmlFor={values.areaIsListed ? "areaName" : "unlistedAreaName"}>Area</label>
        {values.areaIsListed ? <Select id="areaName" name="areaName" label="Area" options={areaOptions} value={values.areaName}
          onChange={(areaName) => update("areaName", areaName)} disabled={!values.areaLga} required
          placeholder={values.areaLga ? "Choose a listed area" : "Choose a council first"}
          describedBy={described("areaName-help", errors.areaName)} error={Boolean(errors.areaName)} /> : <input
          id="unlistedAreaName" name="areaName" value={values.areaName} onChange={(event) => update("areaName", event.target.value)}
          placeholder="Enter your area" minLength={2} maxLength={120} required aria-invalid={Boolean(errors.areaName) || undefined}
          aria-describedby={described("areaName-help", errors.areaName)} />}
        <p className={styles.muted} id="areaName-help">{values.areaIsListed ? "Choose an area from the starter list, or select the option below if it is missing." : "Enter the area name as you know it; it will be marked as unlisted."}</p>
        <label className={styles.checkbox}><input type="checkbox" checked={!values.areaIsListed} onChange={(event) => { editedRef.current = true; setValues((current) => ({ ...current, areaIsListed: !event.target.checked, areaName: "" })); }} /> My area isn&apos;t listed</label>
        <input type="hidden" name="areaIsListed" value={String(values.areaIsListed)} />
        {fieldError("areaName", errors.areaName)}
      </div>

      <div className={styles.field}>
        <label htmlFor="addressLine">Address details</label>
        <p className={styles.muted} id="addressLine-help">Plot or house number, street, nearest landmark</p>
        <textarea id="addressLine" name="addressLine" value={values.addressLine} onChange={(event) => update("addressLine", event.target.value)}
          placeholder="e.g. Plot 12, Cedar Street, near the community health centre" minLength={10} maxLength={500} rows={3} required
          aria-invalid={Boolean(errors.addressLine) || undefined} aria-describedby={described("addressLine-help", errors.addressLine)} />
        {fieldError("addressLine", errors.addressLine)}
      </div>

      <div className={styles.field}>
        <label htmlFor="siteDescription">Plot description</label>
        <textarea id="siteDescription" name="siteDescription" value={values.siteDescription} onChange={(event) => update("siteDescription", event.target.value)}
          placeholder="Describe the plot and how it can be identified. Do not include sensitive documents here."
          minLength={10} maxLength={2000} rows={5} required aria-invalid={Boolean(errors.siteDescription) || undefined}
          aria-describedby={described("siteDescription-help", errors.siteDescription)} />
        <p className={styles.muted} id="siteDescription-help">Describe only the site; do not include sensitive documents.</p>
        {fieldError("siteDescription", errors.siteDescription)}
      </div>

      <div className={styles.field}>
        <label htmlFor="notes">Additional notes</label>
        <textarea id="notes" name="notes" value={values.notes} onChange={(event) => update("notes", event.target.value)}
          placeholder="Optional context for the verification team" maxLength={4000} rows={4}
          aria-invalid={Boolean(errors.notes) || undefined} aria-describedby={described("notes-help", errors.notes)} />
        <p className={styles.muted} id="notes-help">Optional; keep it under 4,000 characters.</p>
        {fieldError("notes", errors.notes)}
      </div>

      <fieldset className={styles.fieldset} aria-describedby={errors.contactPreference ? "contactPreference-error" : undefined}>
        <legend>Preferred contact method</legend>
        {(["email", "phone", "whatsapp"] as const).map((preference, index) => <label key={preference}>
          <input id={index === 0 ? "contactPreference" : undefined} type="radio" name="contactPreference" value={preference} checked={values.contactPreference === preference}
            onChange={() => update("contactPreference", preference)} aria-invalid={Boolean(errors.contactPreference) || undefined} />
          {preference === "whatsapp" ? "WhatsApp" : preference[0].toUpperCase() + preference.slice(1)}
        </label>)}
        {fieldError("contactPreference", errors.contactPreference)}
      </fieldset>
      {values.contactPreference !== "email" ? <>
        <div className={styles.field}><label htmlFor="contactPhone">Nigerian mobile number</label><input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" value={values.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} placeholder="080... or +234..." required aria-invalid={Boolean(errors.contactPhone) || undefined} aria-describedby={errors.contactPhone ? "contactPhone-error" : undefined} />{fieldError("contactPhone", errors.contactPhone)}</div>
        <div><label className={styles.checkbox}><input id="contactPhoneConsent" name="contactPhoneConsent" type="checkbox" checked={values.contactPhoneConsent} onChange={(event) => update("contactPhoneConsent", event.target.checked)} aria-invalid={Boolean(errors.contactPhoneConsent) || undefined} aria-describedby={errors.contactPhoneConsent ? "contactPhoneConsent-error" : undefined} /> So the review team can reach you about this request.</label>{fieldError("contactPhoneConsent", errors.contactPhoneConsent)}</div>
      </> : <><input type="hidden" name="contactPhone" value="" /><input type="hidden" name="contactPhoneConsent" value="false" /></>}

      <div className={styles.notice}>
        This controlled pilot uses synthetic or properly redacted information only.
        Submitting a request does not verify the land or create a legal conclusion.
      </div>

      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {deviceSaveState === "saved" ? <p className={styles.deviceSave} role="status">Saved on this device. This does not submit your request.</p> : null}
      {deviceSaveState === "failed" ? <p className={styles.error} role="alert">This device could not save a recovery copy. Save the request to your account before leaving.</p> : null}
      <SubmitButton pendingLabel="Saving request...">Save and add documents</SubmitButton>
      <p className={styles.muted}>Atexgrove is a demo prototype. Use test details only and don&apos;t enter real land documents or sensitive personal data. A full privacy policy will be published before real use.</p>
    </form>
  );
}
