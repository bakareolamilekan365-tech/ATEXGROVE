import { describe, expect, it } from "vitest";
import { caseTimelineEvents } from "@/lib/verification-cases/status";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import type { CaseStatusEvent } from "@/types/verification";

const event = (overrides: Partial<CaseStatusEvent> = {}): CaseStatusEvent => ({
  id: "a", verification_case_id: "case", actor_user_id: "owner",
  from_status: "needs_customer_info", to_status: "in_review",
  event_kind: "customer_response", reason: "Here are the requested pages.",
  customer_visible: true, created_at: "2026-10-25T08:00:00.001Z", ...overrides,
});

describe("case milestones and preparation windows", () => {
  it("omits old and new upload activity without mutating history", () => {
    const rows = [event(), event({ id: "b", event_kind: "document_uploaded" }),
      event({ id: "c", event_kind: "status_change", from_status: "draft", to_status: "draft", reason: "Document added: Survey plan copy" })];
    expect(caseTimelineEvents(rows)).toEqual([rows[0]]);
    expect(rows).toHaveLength(3);
  });
  it.each(["Customer provided the requested information.", "Your case is now in review."])("coalesces the historical fixed line %s with its response", (reason) => {
    const reply = event();
    const fixed = event({ id: "b", event_kind: reason.startsWith("Your") ? "status_change" : "customer_response", reason, created_at: "2026-10-25T08:00:00.000Z" });
    expect(caseTimelineEvents([reply, fixed])).toEqual([reply]);
  });
  it("coalesces an unambiguous 021 reply even when UUID sort reverses equal timestamps", () => {
    const reply = event({ id: "a" });
    const fixed = event({ id: "z", reason: "Customer provided the requested information." });
    expect(caseTimelineEvents([fixed, reply])).toEqual([reply]);
  });
  it("preserves a standalone review resume action", () => {
    const resume = event({ event_kind: "status_change", reason: "Your case is now in review." });
    expect(caseTimelineEvents([resume])).toEqual([resume]);
  });
  it.each([
    { actor_user_id: "another" }, { verification_case_id: "another" },
    { created_at: "2026-10-25T08:01:00Z" }, { customer_visible: false },
  ])("does not collapse unrelated responses: %j", (overrides) => {
    const fixed = event({ id: "fixed", reason: "Your case is now in review.", event_kind: "status_change", created_at: "2026-10-25T08:00:00Z" });
    expect(caseTimelineEvents([event(overrides), fixed])).toHaveLength(2);
  });
  it("preserves internal staff notes and customer communication", () => {
    const note = event({ event_kind: "staff_note", customer_visible: false });
    const message = event({ id: "m", event_kind: "customer_message" });
    expect(caseTimelineEvents([note, message])).toEqual([note, message]);
  });
  it.each(["submitted", "assigned", "in_review", "closed", "cancelled"] as const)("does not offer upload outside preparation: %s", (status) => {
    expect(customerCaseActions(status).canUploadEvidence).toBe(false);
  });
  it("offers durable preparation on drafts and information requests", () => {
    expect(customerCaseActions("draft").canUploadEvidence).toBe(true);
    expect(customerCaseActions("needs_customer_info").canUploadEvidence).toBe(true);
  });
});
