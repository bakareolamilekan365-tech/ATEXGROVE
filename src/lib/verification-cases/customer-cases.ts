import type { VerificationCase } from "@/types/verification";

export const customerCaseFilters = [
  "all",
  "active",
  "waiting",
  "draft",
  "closed",
  "cancelled",
] as const;

export type CustomerCaseFilter = (typeof customerCaseFilters)[number];

type CustomerCaseListItem = Pick<
  VerificationCase,
  | "workflow_status"
  | "discarded_at"
  | "case_number"
  | "area_lga"
  | "area_name"
  | "address_line"
  | "site_description"
  | "customer_intent"
>;

export function customerCaseGroup(status: VerificationCase["workflow_status"]): Exclude<CustomerCaseFilter, "all"> {
  if (status === "draft") return "draft";
  if (status === "needs_customer_info") return "waiting";
  if (status === "closed") return "closed";
  if (status === "cancelled") return "cancelled";
  return "active";
}

export function filterCustomerCases<T extends CustomerCaseListItem>(
  cases: readonly T[],
  filter: CustomerCaseFilter,
  search: string,
) {
  const query = search.trim().toLocaleLowerCase();
  return cases.filter((item) => {
    if (item.discarded_at) return false;
    if (filter !== "all" && customerCaseGroup(item.workflow_status) !== filter) return false;
    if (!query) return true;
    return [
      item.case_number,
      item.area_lga,
      item.area_name,
      item.address_line,
      item.site_description,
      item.customer_intent,
    ].some((value) => value?.toLocaleLowerCase().includes(query));
  });
}

export function customerCaseCounts(cases: readonly CustomerCaseListItem[]) {
  const visible = cases.filter((item) => !item.discarded_at);
  return {
    all: visible.length,
    active: visible.filter((item) => customerCaseGroup(item.workflow_status) === "active").length,
    waiting: visible.filter((item) => customerCaseGroup(item.workflow_status) === "waiting").length,
    draft: visible.filter((item) => customerCaseGroup(item.workflow_status) === "draft").length,
    closed: visible.filter((item) => customerCaseGroup(item.workflow_status) === "closed").length,
    cancelled: visible.filter((item) => customerCaseGroup(item.workflow_status) === "cancelled").length,
  };
}
