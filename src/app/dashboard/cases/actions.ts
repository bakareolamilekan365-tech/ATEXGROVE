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
    notes: formData.get("notes") ?? "",
    contactPreference: formData.get("contactPreference"),
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
      p_customer_notes: parsed.data.notes || null,
      p_contact_preference: parsed.data.contactPreference,
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
