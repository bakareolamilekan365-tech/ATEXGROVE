"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  buildEvidenceStoragePath,
  customerResponseSchema,
  evidenceUploadSchema,
  MAX_EVIDENCE_FILES_PER_CASE,
  normalizeOriginalFilename,
  validateEvidenceFile,
  validateEvidenceFileSignature,
} from "@/lib/case-evidence/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CASE_SERVICE_SCOPE_NOTICE_VERSION } from "@/lib/verification-cases/service-scope-notice";

export type EvidenceActionState = { error: string | null; success: string | null };

const failure = (error: string): EvidenceActionState => ({ error, success: null });

export async function uploadCaseEvidenceAction(
  _previousState: EvidenceActionState,
  formData: FormData,
): Promise<EvidenceActionState> {
  const parsed = evidenceUploadSchema.safeParse({
    caseId: formData.get("caseId"),
    evidenceType: formData.get("evidenceType"),
    description: formData.get("description"),
    supersedesEvidenceId: formData.get("supersedesEvidenceId") ?? "",
  });
  const file = formData.get("file");

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Check the evidence details.");
  }
  if (!(file instanceof File)) return failure("Choose a file to upload.");

  const fileValidation = validateEvidenceFile(file);
  if (!fileValidation.ok) return failure(fileValidation.error);
  if (!(await validateEvidenceFileSignature(file))) {
    return failure("The file contents do not match its declared PDF, JPG or PNG type.");
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const { data: verificationCase } = await supabase
    .from("verification_cases")
    .select("id, workflow_status")
    .eq("id", parsed.data.caseId)
    .eq("customer_user_id", user.id)
    .maybeSingle();

  if (!verificationCase) return failure("This case was not found or is not yours.");
  if (!["draft", "submitted", "assigned", "in_review", "needs_customer_info"].includes(verificationCase.workflow_status)) {
    return failure("This case is not accepting documents.");
  }

  const { count, error: countError } = await supabase
    .from("case_evidence")
    .select("id", { count: "exact", head: true })
    .eq("verification_case_id", parsed.data.caseId);
  if (countError) return failure("We could not check this case's documents.");
  if ((count ?? 0) >= MAX_EVIDENCE_FILES_PER_CASE) {
    return failure("This case already has the maximum of 10 files.");
  }

  const evidenceId = crypto.randomUUID();
  const storagePath = buildEvidenceStoragePath(
    parsed.data.caseId,
    evidenceId,
    crypto.randomUUID(),
    file.type,
  );
  const originalFilename = normalizeOriginalFilename(file.name);
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return failure("Document upload is not configured on the server.");
  }

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return failure("The file could not be uploaded. Check its type and size.");

  const { error: registrationError } = await supabase.rpc("register_case_evidence", {
    p_evidence_id: evidenceId,
    p_case_id: parsed.data.caseId,
    p_evidence_type: parsed.data.evidenceType,
    p_description: parsed.data.description,
    p_storage_path: storagePath,
    p_original_filename: originalFilename,
    p_mime_type: file.type,
    p_size_bytes: file.size,
    p_supersedes_evidence_id: parsed.data.supersedesEvidenceId || null,
  });

  if (registrationError) {
    await admin.storage.from("documents").remove([storagePath]);
    return failure("The document could not be registered. Please try again.");
  }

  revalidatePath(`/dashboard/cases/${parsed.data.caseId}`);
  revalidatePath(`/ops/cases/${parsed.data.caseId}`);
  return { error: null, success: "Document added." };
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
  });
  if (error) return failure("The response was not allowed or the case has changed.");

  revalidatePath(`/dashboard/cases/${parsed.data.caseId}`);
  revalidatePath(`/ops/cases/${parsed.data.caseId}`);
  return { error: null, success: "Response sent. Review has resumed." };
}
