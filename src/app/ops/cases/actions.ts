"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLead, requireStaff } from "@/lib/auth/guards";
import { createAuthorizedEvidenceDownload } from "@/lib/case-evidence/download";
import {
  assignmentSchema,
  statusTransitionSchema,
} from "@/lib/verification-cases/validation";

export type OpsActionState = { error: string | null; success: string | null };

const failure = (error: string): OpsActionState => ({ error, success: null });

export async function assignVerificationCaseAction(
  _previousState: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  const parsed = assignmentSchema.safeParse({
    caseId: formData.get("caseId"),
    assigneeUserId: formData.get("assigneeUserId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Check the assignment.");
  }

  const { supabase } = await requireLead();
  const { error } = await supabase.rpc("assign_verification_case", {
    p_case_id: parsed.data.caseId,
    p_assignee_user_id: parsed.data.assigneeUserId,
    p_note: parsed.data.note,
  });

  if (error) {
    return failure("The assignment was not allowed or the case has changed.");
  }

  revalidatePath("/ops/cases");
  revalidatePath(`/ops/cases/${parsed.data.caseId}`);
  return { error: null, success: "Case assigned." };
}

export async function transitionVerificationCaseAction(
  _previousState: OpsActionState,
  formData: FormData,
): Promise<OpsActionState> {
  const parsed = statusTransitionSchema.safeParse({
    caseId: formData.get("caseId"),
    toStatus: formData.get("toStatus"),
    staffNote: formData.get("staffNote"),
    customerMessage: formData.get("customerMessage") ?? "",
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Check the status change.");
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("transition_verification_case", {
    p_case_id: parsed.data.caseId,
    p_to_status: parsed.data.toStatus,
    p_staff_note: parsed.data.staffNote,
    p_customer_message: parsed.data.customerMessage,
  });

  if (error) {
    return failure("The status change was not allowed or the case has changed.");
  }

  revalidatePath("/ops/cases");
  revalidatePath(`/ops/cases/${parsed.data.caseId}`);
  revalidatePath("/dashboard");
  return { error: null, success: "Status updated." };
}

export async function downloadCaseEvidenceAction(formData: FormData) {
  const evidenceId = formData.get("evidenceId");
  if (typeof evidenceId !== "string") return;

  const { supabase } = await requireStaff();
  const signedUrl = await createAuthorizedEvidenceDownload(supabase, evidenceId);
  redirect(signedUrl);
}
