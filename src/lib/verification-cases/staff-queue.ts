import type { VerificationCase } from "@/types/verification";

export const STAFF_DASHBOARD_CARD_LIMIT = 5;

export type StaffQueueGroup = {
  key: string;
  title: string;
  statuses: readonly VerificationCase["workflow_status"][];
  statusFilter?: VerificationCase["workflow_status"];
  groupFilter?: "review";
};

export const staffQueueGroups: readonly StaffQueueGroup[] = [
  { key: "awaiting", title: "Awaiting assignment", statuses: ["submitted"], statusFilter: "submitted" },
  { key: "review", title: "In review", statuses: ["assigned", "in_review"], groupFilter: "review" },
  { key: "client", title: "Waiting on client", statuses: ["needs_customer_info"], statusFilter: "needs_customer_info" },
  { key: "closed", title: "Closed", statuses: ["closed"], statusFilter: "closed" },
  { key: "cancelled", title: "Cancelled", statuses: ["cancelled"], statusFilter: "cancelled" },
] as const;

export function groupStaffCases(cases: VerificationCase[]) {
  return staffQueueGroups.map((group) => ({
    ...group,
    cases: cases.filter((item) => (group.statuses as readonly string[]).includes(item.workflow_status)),
  }));
}

export function staffDashboardCases(cases: VerificationCase[]) {
  return groupStaffCases(cases).map((group) => ({
    ...group,
    visibleCases: group.cases.slice(0, STAFF_DASHBOARD_CARD_LIMIT),
  }));
}
