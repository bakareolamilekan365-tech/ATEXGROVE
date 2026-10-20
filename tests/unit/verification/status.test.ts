import { describe, expect, it } from "vitest";
import {
  availableCaseTransitions,
  canTransitionVerificationCase,
  caseStatusLabels,
  customerSafeStatusMessages,
  timelineEventAudienceLabel,
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
});

describe("customer-safe case timeline", () => {
  it("separates fixed status text from staff notes and customer messages", () => {
    expect(customerSafeStatusMessages.in_review).toBe("Your case is now in review.");
    expect(customerSafeStatusMessages.needs_customer_info).toBe("The review team needs more information from you.");
    expect(customerSafeStatusMessages.closed).toBe("This case was closed. No verification result was issued.");
    expect(customerSafeStatusMessages.cancelled).toBe("This case was cancelled.");
    expect(timelineEventAudienceLabel("in_review", "Your case is now in review.", true)).toBe("Customer status");
    expect(timelineEventAudienceLabel("in_review", "Internal analysis note", false)).toBe("Staff-only note");
    expect(timelineEventAudienceLabel("in_review", "We have begun the review.", true)).toBe("Customer message");
  });
});
