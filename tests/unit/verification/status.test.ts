import { describe, expect, it } from "vitest";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import {
  availableCaseTransitions,
  canTransitionVerificationCase,
  caseStatusEventKindLabels,
  caseStatusLabels,
  customerSafeStatusMessages,
  timelineEventKindLabel,
} from "@/lib/verification-cases/status";

describe("verification case status transitions", () => {
  it.each([
    ["assigned", "in_review"],
    ["in_review", "needs_customer_info"],
    ["needs_customer_info", "in_review"],
    ["in_review", "closed"],
    ["in_review", "cancelled"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransitionVerificationCase(from, to)).toBe(true);
  });

  it.each([
    ["submitted", "in_review"],
    ["assigned", "closed"],
    ["needs_customer_info", "closed"],
    ["closed", "in_review"],
    ["cancelled", "submitted"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransitionVerificationCase(from, to)).toBe(false);
  });

  it("offers only the transitions valid for the current state", () => {
    expect(availableCaseTransitions("in_review")).toEqual([
      "needs_customer_info",
      "closed",
      "cancelled",
    ]);
    expect(availableCaseTransitions("closed")).toEqual([]);
  });

  it("keeps the submitted label honest", () => {
    expect(caseStatusLabels.submitted).toBe("Received — not yet verified");
    expect(caseStatusLabels.submitted.toLowerCase()).not.toBe("verified");
    expect(caseStatusLabels.closed).toBe("Closed — no verification result issued");
  });

  it("labels drafts clearly and exposes only valid customer actions", () => {
    expect(caseStatusLabels.draft).toBe("Draft — not submitted");
    expect(customerCaseActions("draft")).toEqual({
      canUploadEvidence: true,
      canSubmitDraft: true,
      canDiscardDraft: true,
      canCancel: false,
    });
    expect(customerCaseActions("needs_customer_info").canCancel).toBe(true);
    expect(customerCaseActions("closed")).toEqual({
      canUploadEvidence: false,
      canSubmitDraft: false,
      canDiscardDraft: false,
      canCancel: false,
    });
  });
});

describe("customer-safe case timeline", () => {
  it("maps every event kind without inferring meaning from its text", () => {
    expect(customerSafeStatusMessages.in_review).toBe("Your case is now in review.");
    expect(customerSafeStatusMessages.needs_customer_info).toBe("The review team needs more information from you.");
    expect(customerSafeStatusMessages.closed).toBe("This case was closed. No verification result was issued.");
    expect(customerSafeStatusMessages.cancelled).toBe("This case was cancelled.");
    expect(caseStatusEventKindLabels).toEqual({
      status_change: "Status change",
      staff_note: "Staff-only note",
      customer_message: "Customer message",
      information_requested: "Information requested",
      customer_response: "Customer response",
    });
    expect(timelineEventKindLabel("information_requested")).toBe("Information requested");
    expect(timelineEventKindLabel("customer_response")).toBe("Customer response");
  });
});
