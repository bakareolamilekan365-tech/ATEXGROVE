import { describe, expect, it } from "vitest";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import {
  availableCaseTransitions,
  canTransitionVerificationCase,
  caseStatusEventKindLabels,
  caseStatusLabels,
  customerSafeStatusMessages,
  timelineEventHeading,
  timelineEventKindForDisplay,
  timelineEventKindLabel,
} from "@/lib/verification-cases/status";

describe("verification case status transitions", () => {
  it.each([
    ["assigned", "in_review"],
    ["in_review", "needs_customer_info"],
    ["needs_customer_info", "closed"],
    ["needs_customer_info", "cancelled"],
    ["in_review", "closed"],
    ["in_review", "cancelled"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransitionVerificationCase(from, to)).toBe(true);
  });

  it.each([
    ["submitted", "in_review"],
    ["assigned", "closed"],
    ["needs_customer_info", "in_review"],
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
    expect(availableCaseTransitions("needs_customer_info")).toEqual(["closed", "cancelled"]);
    expect(availableCaseTransitions("closed")).toEqual([]);
  });

  it("keeps the submitted label honest", () => {
    expect(caseStatusLabels.submitted).toBe("Received");
    expect(caseStatusLabels.submitted.toLowerCase()).not.toBe("verified");
    expect(caseStatusLabels.closed).toBe("Closed");
  });

  it("labels drafts clearly and exposes only valid customer actions", () => {
    expect(caseStatusLabels.draft).toBe("Draft");
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
    expect(customerSafeStatusMessages.closed).toBe("This request has been closed. The review ended without a final land assessment.");
    expect(customerSafeStatusMessages.cancelled).toBe("This request was cancelled.");
    expect(caseStatusEventKindLabels).toEqual({
      status_change: "Workflow status",
      staff_note: "Staff-only note",
      customer_message: "Customer message",
      information_requested: "Information request",
      customer_response: "Customer reply",
      document_uploaded: "Evidence activity",
    });
    expect(timelineEventKindLabel("information_requested")).toBe("Information request");
    expect(timelineEventKindLabel("customer_response")).toBe("Customer reply");
  });

  it("renders uploaded documents as activity rather than a status transition", () => {
    const upload = {
      event_kind: "document_uploaded" as const,
      from_status: "draft" as const,
      to_status: "draft" as const,
      reason: "Title deed copy uploaded",
    };
    expect(timelineEventHeading(upload)).toBe("Document uploaded");
    expect(timelineEventKindLabel(timelineEventKindForDisplay(upload))).toBe("Evidence activity");

    const legacyUpload = { ...upload, event_kind: "status_change" as const, reason: "Document added: Title deed copy" };
    expect(timelineEventHeading(legacyUpload)).toBe("Document uploaded");
    expect(timelineEventKindForDisplay(legacyUpload)).toBe("document_uploaded");
  });

  it("shows a customer reply separately from its status transition, including legacy rows", () => {
    const transition = {
      event_kind: "status_change" as const,
      from_status: "needs_customer_info" as const,
      to_status: "in_review" as const,
      reason: "Your case is now in review.",
    };
    const reply = { ...transition, event_kind: "customer_response" as const, reason: "I have provided the requested plan." };
    expect(timelineEventHeading(transition)).toBe("In review");
    expect(timelineEventHeading(reply)).toBe("Customer response submitted");
    expect(timelineEventKindLabel(timelineEventKindForDisplay(reply))).toBe("Customer reply");

    const legacyTransition = { ...reply, reason: "Customer provided the requested information." };
    expect(timelineEventHeading(legacyTransition)).toBe("In review");
    expect(timelineEventKindForDisplay(legacyTransition)).toBe("status_change");
  });
});
