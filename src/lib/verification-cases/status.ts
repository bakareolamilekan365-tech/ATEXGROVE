import type {
  CaseStatusEventKind,
  VerificationCaseStatus,
} from "@/types/verification";

export const caseStatusLabels: Record<VerificationCaseStatus, string> = {
  draft: "Draft",
  submitted: "Received — not yet verified",
  assigned: "Assigned — not yet verified",
  in_review: "In review — not yet verified",
  needs_customer_info: "More information needed",
  closed: "Closed — no verification result issued",
  cancelled: "Cancelled",
};

export const customerSafeStatusMessages: Readonly<
  Partial<Record<VerificationCaseStatus, string>>
> = {
  submitted: "Request submitted by customer.",
  in_review: "Your case is now in review.",
  needs_customer_info: "The review team needs more information from you.",
  closed: "This case was closed. No verification result was issued.",
  cancelled: "This case was cancelled.",
};

export const caseStatusEventKindLabels: Readonly<
  Record<CaseStatusEventKind, string>
> = {
  status_change: "Status change",
  staff_note: "Staff-only note",
  customer_message: "Customer message",
  information_requested: "Information requested",
  customer_response: "Customer response",
};

export function timelineEventKindLabel(eventKind: CaseStatusEventKind) {
  return caseStatusEventKindLabels[eventKind];
}

export const caseStatusTransitions: Readonly<
  Partial<Record<VerificationCaseStatus, readonly VerificationCaseStatus[]>>
> = {
  assigned: ["in_review"],
  in_review: ["needs_customer_info", "closed", "cancelled"],
  needs_customer_info: ["in_review"],
};

export function canTransitionVerificationCase(
  from: VerificationCaseStatus,
  to: VerificationCaseStatus,
) {
  return caseStatusTransitions[from]?.includes(to) ?? false;
}

export function availableCaseTransitions(from: VerificationCaseStatus) {
  return caseStatusTransitions[from] ?? [];
}
