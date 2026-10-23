"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";

export type CaseFormState = { error: string | null };

export async function createVerificationCaseAction(
  _previousState: CaseFormState,
  formData: FormData,
): Promise<CaseFormState> {
  const parsed = newVerificationCaseSchema.safeParse({
    idempotencyKey: formData.get("idempotencyKey"),
    siteDescription: formData.get("siteDescription"),
    areaLga: formData.get("areaLga"),
    areaName: formData.get("areaName"),
    areaIsListed: formData.get("areaIsListed") === "true",
    addressLine: formData.get("addressLine"),
    notes: formData.get("notes") ?? "",
    contactPreference: formData.get("contactPreference"),
    contactPhone: formData.get("contactPhone") ?? "",
    contactPhoneConsent: formData.get("contactPhoneConsent") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const { supabase } = await requireAuthenticatedUser();
  const { data: caseId, error } = await supabase.rpc(
    "create_verification_case",
    {
      p_site_description: parsed.data.siteDescription,
      p_area_lga: parsed.data.areaLga,
      p_area_name: parsed.data.areaName,
      p_area_is_listed: parsed.data.areaIsListed,
      p_address_line: parsed.data.addressLine,
      p_customer_notes: parsed.data.notes || null,
      p_contact_preference: parsed.data.contactPreference,
      p_contact_phone: parsed.data.contactPhone || null,
      p_contact_phone_consent: parsed.data.contactPhoneConsent,
      p_idempotency_key: parsed.data.idempotencyKey,
    },
  );

  if (error || !caseId) {
    return {
      error: "We could not submit this request. Check the details and try again.",
    };
  }

  redirect("/dashboard?request=submitted");
}
