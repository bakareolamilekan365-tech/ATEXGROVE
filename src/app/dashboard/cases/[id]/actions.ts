"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  customerResponseSchema,
  evidenceFinalizationSchema,
  evidenceStoragePathMatches,
  normalizeOriginalFilename,
  type EvidenceFinalizationInput,
} from "@/lib/case-evidence/validation";
import {
  cleanupAfterRegistrationFailure,
  cleanupAfterVerificationFailure,
  logEvidenceFailure,
} from "@/lib/case-evidence/upload-errors";
import { verifyStoredEvidenceObject } from "@/lib/case-evidence/stored-object";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CASE_SERVICE_SCOPE_NOTICE_VERSION } from "@/lib/verification-cases/service-scope-notice";

export type EvidenceActionState = { error: string | null; success: string | null };

const failure = (error: string): EvidenceActionState => ({ error, success: null });

export async function finalizeCaseEvidenceUploadAction(
  input: EvidenceFinalizationInput,
): Promise<EvidenceActionState> {
  const { supabase, user } = await requireAuthenticatedUser();
  const parsed = evidenceFinalizationSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Check the evidence details.");
  }
  const details = parsed.data;
  const normalizedFilename = normalizeOriginalFilename(details.originalFilename);
  if (normalizedFilename !== details.originalFilename) {
    return failure("The original filename was not normalized safely.");
  }
  if (!evidenceStoragePathMatches(
    details.storagePath,
    details.caseId,
    details.evidenceId,
    details.mimeType,
  )) {
    return failure("The uploaded file path is invalid.");
  }

  const { data: verificationCase, error: caseLookupError } = await supabase
    .from("verification_cases")
    .select("id, workflow_status, discarded_at")
    .eq("id", details.caseId)
    .eq("customer_user_id", user.id)
    .maybeSingle();

  if (caseLookupError) {
    logEvidenceFailure("case_lookup", caseLookupError, [details.originalFilename, details.storagePath]);
    return failure("We could not check this case. Refresh the page and try again.");
  }
  if (!verificationCase) return failure("This case was not found or is not yours.");

  const removeUploadedObject = async () => {
    const admin = createSupabaseAdminClient();
    return admin.storage.from("documents").remove([details.storagePath]);
  };

  if (verificationCase.discarded_at || !["draft", "needs_customer_info"].includes(verificationCase.workflow_status)) {
    await cleanupAfterVerificationFailure(
      new Error("Case state changed before evidence finalization."),
      details.storagePath,
      [details.originalFilename],
      removeUploadedObject,
    );
    return failure("This case is not accepting documents.");
  }

  try {
    await verifyStoredEvidenceObject({
      storagePath: details.storagePath,
      mimeType: details.mimeType,
      sizeBytes: details.sizeBytes,
    });
  } catch (error) {
    const message = await cleanupAfterVerificationFailure(
      error,
      details.storagePath,
      [details.originalFilename],
      removeUploadedObject,
    );
    return failure(message);
  }

  let registrationError: unknown | null = null;
  try {
    const result = await supabase.rpc("register_case_evidence", {
      p_evidence_id: details.evidenceId,
      p_case_id: details.caseId,
      p_evidence_type: details.evidenceType,
      p_description: details.description,
      p_storage_path: details.storagePath,
      p_original_filename: details.originalFilename,
      p_mime_type: details.mimeType,
      p_size_bytes: details.sizeBytes,
      p_supersedes_evidence_id: details.supersedesEvidenceId || null,
    });
    registrationError = result.error;
  } catch (error) {
    registrationError = error;
  }

  if (registrationError) {
    const message = await cleanupAfterRegistrationFailure(
      registrationError,
      details.storagePath,
      [details.originalFilename],
      removeUploadedObject,
    );
    return failure(message);
  }

  revalidatePath(`/dashboard/cases/${details.caseId}`);
  return {
    error: null,
    success: "Saved — not yet submitted to the review team",
  };
}

export async function submitDraftCaseAction(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const accepted = formData.get("serviceScopeAccepted") === "on";
  if (!accepted) throw new Error("Accept the service-scope notice before submitting.");
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("submit_verification_case", {
    p_case_id: caseId,
    p_notice_version: String(formData.get("noticeVersion") ?? CASE_SERVICE_SCOPE_NOTICE_VERSION),
    p_accepted: accepted,
  });
  if (error) throw new Error("This draft could not be submitted. Refresh and try again.");
  revalidatePath("/dashboard");
  redirect(`/dashboard/cases/${caseId}`);
}

export async function discardDraftCaseAction(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("discard_draft_case", { p_case_id: caseId });
  if (error) throw new Error("This draft could not be discarded. Refresh and try again.");
  revalidatePath("/dashboard");
  redirect(`/dashboard/cases/${caseId}`);
}

export async function cancelVerificationCaseAction(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (reason.length > 2000) throw new Error("The reason must be 2,000 characters or fewer.");
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("cancel_verification_case", {
    p_case_id: caseId,
    p_reason: reason,
  });
  if (error) throw new Error("This request could not be cancelled. Refresh and try again.");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cases/${caseId}`);
  redirect(`/dashboard/cases/${caseId}`);
}

export async function customerRespondToCaseAction(
  _previousState: EvidenceActionState,
  formData: FormData,
): Promise<EvidenceActionState> {
  const parsed = customerResponseSchema.safeParse({
    caseId: formData.get("caseId"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Check your response.");
  }

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc("customer_respond_to_case", {
    p_case_id: parsed.data.caseId,
    p_message: parsed.data.message,
    p_request_event_id: String(formData.get("requestEventId") ?? ""),
  });
  if (error) return failure("The response was not allowed or the case has changed.");

  revalidatePath(`/dashboard/cases/${parsed.data.caseId}`);
  revalidatePath(`/ops/cases/${parsed.data.caseId}`);
  return { error: null, success: "Response submitted. Documents released for review — not authenticated." };
}
