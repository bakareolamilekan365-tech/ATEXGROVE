import { describe, expect, it } from "vitest";
import { STAFF_DASHBOARD_CARD_LIMIT, groupStaffCases, staffDashboardCases } from "@/lib/verification-cases/staff-queue";
import type { VerificationCase } from "@/types/verification";

function caseWith(id: string, workflow_status: VerificationCase["workflow_status"]): VerificationCase {
  return { id, workflow_status } as VerificationCase;
}

describe("staff queue presentation", () => {
  it("keeps closed and cancelled cases in separate groups", () => {
    const groups = groupStaffCases([caseWith("closed", "closed"), caseWith("cancelled", "cancelled")]);
    expect(groups.find((group) => group.key === "closed")?.cases.map((item) => item.id)).toEqual(["closed"]);
    expect(groups.find((group) => group.key === "cancelled")?.cases.map((item) => item.id)).toEqual(["cancelled"]);
  });

  it("limits every dashboard category to five cards without changing its total", () => {
    const cases = Array.from({ length: 7 }, (_, index) => caseWith(`case-${index}`, "submitted"));
    const awaiting = staffDashboardCases(cases).find((group) => group.key === "awaiting");
    expect(awaiting?.cases).toHaveLength(7);
    expect(awaiting?.visibleCases).toHaveLength(STAFF_DASHBOARD_CARD_LIMIT);
  });
});
