import { describe, expect, it } from "vitest";
import { customerCaseCounts, filterCustomerCases } from "@/lib/verification-cases/customer-cases";

const cases = [
  { workflow_status: "draft" as const, discarded_at: null, case_number: "ATX-001", area_lga: "AMAC", area_name: "Gwarinpa", address_line: "Plot 1", site_description: "Draft development request", customer_intent: "developing" as const },
  { workflow_status: "needs_customer_info" as const, discarded_at: null, case_number: "ATX-002", area_lga: "Bwari", area_name: "Kubwa", address_line: "Plot 2", site_description: "Customer reply needed", customer_intent: "buying" as const },
  { workflow_status: "cancelled" as const, discarded_at: null, case_number: "ATX-003", area_lga: "Kuje", area_name: "Kuje", address_line: "Plot 3", site_description: "Genuine cancelled request", customer_intent: "buying" as const },
  { workflow_status: "cancelled" as const, discarded_at: "2026-10-20T10:00:00Z", case_number: "ATX-004", area_lga: "Gwagwalada", area_name: "Zuba", address_line: "Plot 4", site_description: "Discarded draft", customer_intent: "buying" as const },
  { workflow_status: "in_review" as const, discarded_at: null, case_number: "ATX-005", area_lga: "AMAC", area_name: "Maitama", address_line: "Plot 5", site_description: "Review in progress", customer_intent: "own_or_occupy" as const },
];

describe("customer case filtering", () => {
  it("excludes discarded drafts from every result and count", () => {
    expect(filterCustomerCases(cases, "all", "").map((item) => item.case_number)).not.toContain("ATX-004");
    expect(customerCaseCounts(cases)).toMatchObject({ all: 4, cancelled: 1 });
  });

  it("keeps active drafts and genuine cancellations in separate filters", () => {
    expect(filterCustomerCases(cases, "draft", "").map((item) => item.case_number)).toEqual(["ATX-001"]);
    expect(filterCustomerCases(cases, "cancelled", "").map((item) => item.case_number)).toEqual(["ATX-003"]);
  });

  it("filters in-progress and waiting cases without combining them", () => {
    expect(filterCustomerCases(cases, "active", "").map((item) => item.case_number)).toEqual(["ATX-005"]);
    expect(filterCustomerCases(cases, "waiting", "").map((item) => item.case_number)).toEqual(["ATX-002"]);
  });

  it("searches only visible case text after status filtering", () => {
    expect(filterCustomerCases(cases, "all", "maitama").map((item) => item.case_number)).toEqual(["ATX-005"]);
    expect(filterCustomerCases(cases, "draft", "ATX-003")).toEqual([]);
  });
});
