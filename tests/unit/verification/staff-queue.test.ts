import { describe, expect, it } from "vitest";
import { groupStaffCases, staffDashboardCases } from "@/lib/verification-cases/staff-queue";
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

  it("uses five active previews and three terminal previews without changing totals", () => {
    const cases = [
      ...Array.from({ length: 7 }, (_, index) => caseWith(`submitted-${index}`, "submitted")),
      ...Array.from({ length: 6 }, (_, index) => caseWith(`closed-${index}`, "closed")),
      ...Array.from({ length: 4 }, (_, index) => caseWith(`cancelled-${index}`, "cancelled")),
    ];
    const groups = staffDashboardCases(cases);
    const awaiting = groups.find((group) => group.key === "awaiting");
    const closed = groups.find((group) => group.key === "closed");
    const cancelled = groups.find((group) => group.key === "cancelled");
    expect(awaiting?.cases).toHaveLength(7);
    expect(awaiting?.visibleCases).toHaveLength(5);
    expect(closed?.cases).toHaveLength(6);
    expect(closed?.visibleCases).toHaveLength(3);
    expect(cancelled?.cases).toHaveLength(4);
    expect(cancelled?.visibleCases).toHaveLength(3);
  });
});
