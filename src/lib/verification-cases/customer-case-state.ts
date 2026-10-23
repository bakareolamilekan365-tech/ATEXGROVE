import type { VerificationCaseStatus } from "@/types/verification";

const evidenceStatuses: readonly VerificationCaseStatus[] = [
  "draft", "submitted", "assigned", "in_review", "needs_customer_info",
];
const cancellableStatuses: readonly VerificationCaseStatus[] = [
  "submitted", "assigned", "in_review", "needs_customer_info",
];

export function customerCaseActions(status: VerificationCaseStatus) {
  return {
    canUploadEvidence: evidenceStatuses.includes(status),
    canSubmitDraft: status === "draft",
    canDiscardDraft: status === "draft",
    canCancel: cancellableStatuses.includes(status),
  };
}
