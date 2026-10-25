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
  "event_kind" | "from_status" | "to_status" | "reason" | "response_to_event_id"
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
  "event_kind" | "from_status" | "to_status" | "reason" | "response_to_event_id"
>) {
  if (isLegacyUploadEvent(event)) return "Document uploaded";
  if (
    event.event_kind === "customer_response" &&
    !event.response_to_event_id &&
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
      return "Customer response submitted";
    case "information_requested":
      return "Information requested";
    case "staff_note":
      return "Staff note";
    case "document_uploaded":
      return "Document uploaded";
  }
}

export function timelineEventKindForDisplay(event: Pick<CaseStatusEvent,
  "event_kind" | "from_status" | "to_status" | "reason" | "response_to_event_id"
>): CaseStatusEventKind {
  if (isLegacyUploadEvent(event)) return "document_uploaded";
  if (
    event.event_kind === "customer_response" &&
    !event.response_to_event_id &&
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
  needs_customer_info: ["closed", "cancelled"],
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

/** Presentation only: history and audits stay append-only in the database. */
export function caseTimelineEvents(events: readonly CaseStatusEvent[]): CaseStatusEvent[] {
  const milestones = events.filter((event) =>
    timelineEventKindForDisplay(event) !== "document_uploaded",
  );
  // 019/021/025 wrote a fixed resume line immediately before the actual reply.
  // Suppress only an unambiguous companion: same case/actor/transition, within
  // one second, with no intervening milestone. Unmatched historical rows remain.
  const chronological = [...milestones].sort((a, b) =>
    Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
  );
  const redundant = new Set<string>();
  for (let i = 0; i < chronological.length; i++) {
    const fixed = chronological[i];
    const next = chronological[i + 1];
    if (!next || fixed.from_status !== "needs_customer_info" || fixed.to_status !== "in_review") continue;
    if (!((fixed.event_kind === "status_change" && fixed.reason === "Your case is now in review.") ||
      (fixed.event_kind === "customer_response" && fixed.reason === legacyResponseStatusLine))) continue;
    if (!next.response_to_event_id && next.event_kind === "customer_response" && next.reason !== legacyResponseStatusLine &&
      next.verification_case_id === fixed.verification_case_id && next.actor_user_id === fixed.actor_user_id &&
      next.from_status === fixed.from_status && next.to_status === fixed.to_status &&
      next.customer_visible === fixed.customer_visible &&
      Date.parse(next.created_at) - Date.parse(fixed.created_at) <= 1000) redundant.add(fixed.id);
  }
  for (const fixed of chronological) {
    if (fixed.response_to_event_id || fixed.event_kind !== "customer_response" || fixed.reason !== legacyResponseStatusLine ||
      fixed.from_status !== "needs_customer_info" || fixed.to_status !== "in_review") continue;
    const group = chronological.filter((candidate) =>
      candidate.created_at === fixed.created_at && candidate.verification_case_id === fixed.verification_case_id &&
      candidate.actor_user_id === fixed.actor_user_id && candidate.customer_visible === fixed.customer_visible &&
      candidate.from_status === fixed.from_status && candidate.to_status === fixed.to_status &&
      candidate.event_kind === "customer_response",
    );
    if (group.length === 2 && group.filter((candidate) => candidate.reason === legacyResponseStatusLine).length === 1) {
      redundant.add(fixed.id);
    }
  }
  return milestones.filter((event) => !redundant.has(event.id));
}
