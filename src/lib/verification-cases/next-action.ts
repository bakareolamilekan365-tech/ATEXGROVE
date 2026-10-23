import type { VerificationCaseStatus } from "@/types/verification";

export type NextAction = "customer" | "atexgrove" | "none";

export function nextActionForCase(status: VerificationCaseStatus): NextAction {
  if (status === "draft" || status === "needs_customer_info") return "customer";
  if (status === "submitted" || status === "assigned" || status === "in_review") return "atexgrove";
  return "none";
}

export function nextActionLabel(status: VerificationCaseStatus): string {
  const action = nextActionForCase(status);
  if (action === "customer") return "Action required from you";
  if (action === "atexgrove") return "Atexgrove is reviewing";
  return "No action required";
}
