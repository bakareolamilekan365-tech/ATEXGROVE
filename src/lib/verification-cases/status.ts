import type {
  CaseStatusEvent,
  CaseStatusEventKind,
  VerificationCaseStatus,
} from "@/types/verification";

export const caseStatusLabels: Record<VerificationCaseStatus, string> = {
  draft: "Draft — not submitted",
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
  status_change: "Workflow status",
  staff_note: "Staff-only note",
  customer_message: "Customer message",
  information_requested: "Information request",
  customer_response: "Customer reply",
  document_uploaded: "Evidence activity",
};

export function timelineEventKindLabel(eventKind: CaseStatusEventKind) {
  return caseStatusEventKindLabels[eventKind];
}

const legacyResponseStatusLine = "Customer provided the requested information.";

function isLegacyUploadEvent(event: Pick<CaseStatusEvent,
  "event_kind" | "from_status" | "to_status" | "reason"
>) {
  return event.event_kind === "status_change"
    && event.from_status === event.to_status
    && event.reason.startsWith("Document added: ");
}

/**
 * Gives each timeline activity a semantic heading. Old customer-response RPCs
 * stored the fixed transition line and the actual reply with the same kind;
 * classify only that exact historical system line as the status transition.
 */
export function timelineEventHeading(event: Pick<CaseStatusEvent,
  "event_kind" | "from_status" | "to_status" | "reason"
>) {
  if (isLegacyUploadEvent(event)) return "Document uploaded";
  if (
    event.event_kind === "customer_response" &&
    event.reason === legacyResponseStatusLine &&
    event.from_status === "needs_customer_info" &&
    event.to_status === "in_review"
  ) {
    return caseStatusLabels.in_review;
  }

  switch (event.event_kind) {
    case "status_change":
      return caseStatusLabels[event.to_status];
    case "customer_message":
      return "Customer message";
    case "customer_response":
      return "Customer response";
    case "information_requested":
      return "Information requested";
    case "staff_note":
      return "Staff note";
    case "document_uploaded":
      return "Document uploaded";
  }
}

export function timelineEventKindForDisplay(event: Pick<CaseStatusEvent,
  "event_kind" | "from_status" | "to_status" | "reason"
>): CaseStatusEventKind {
  if (isLegacyUploadEvent(event)) return "document_uploaded";
  if (
    event.event_kind === "customer_response" &&
    event.reason === legacyResponseStatusLine &&
    event.from_status === "needs_customer_info" &&
    event.to_status === "in_review"
  ) {
    return "status_change";
  }
  return event.event_kind;
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
