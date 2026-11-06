import Link from "next/link";
import { redirect } from "next/navigation";
import { CaseProgress } from "@/components/cases/CaseProgress";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  customerCaseFilters,
  customerCaseGroup,
  filterCustomerCases,
  type CustomerCaseFilter,
} from "@/lib/verification-cases/customer-cases";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";
import { nextActionLabel } from "@/lib/verification-cases/next-action";
import type { VerificationCase, VerificationCaseStatus } from "@/types/verification";

export const dynamic = "force-dynamic";

const filterLabels: Record<CustomerCaseFilter, string> = {
  all: "All cases",
  active: "In progress",
  waiting: "Waiting on me",
  draft: "Drafts",
  closed: "Closed",
  cancelled: "Cancelled",
};

const groupOrder: Exclude<CustomerCaseFilter, "all">[] = ["draft", "waiting", "active", "closed", "cancelled"];

export default async function CustomerCasesPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string; status?: string }> }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const filter = customerCaseFilters.includes(params.status as CustomerCaseFilter)
    ? params.status as CustomerCaseFilter
    : "all";
  const search = params.q?.trim() ?? "";
  const { data, error } = await supabase
    .from("verification_cases")
    .select("id, case_number, customer_user_id, created_by_user_id, creation_channel, jurisdiction, department, site_description, area_lga, area_name, area_is_listed, address_line, contact_phone, contact_phone_consent, customer_notes, contact_preference, current_stage, workflow_status, assigned_lead_user_id, is_demo_data, idempotency_key, discarded_at, customer_intent, relationship_to_land, acting_for, principal_name, authority_confirmed, information_request_event_id, created_at, updated_at")
    .eq("customer_user_id", user.id)
    .is("discarded_at", null)
    .order("updated_at", { ascending: false });
  const cases = (data ?? []) as VerificationCase[];
  const visibleCases = filterCustomerCases(cases, filter, search);
  const { data: progressEvents } = visibleCases.length
    ? await supabase
        .from("case_status_events")
        .select("verification_case_id, to_status")
        .eq("customer_visible", true)
        .in("event_kind", ["status_change", "information_requested"])
        .in("verification_case_id", visibleCases.map((item) => item.id))
    : { data: [] as { verification_case_id: string; to_status: VerificationCaseStatus }[] };
  const progressHistory = new Map<string, VerificationCaseStatus[]>();
  for (const event of progressEvents ?? []) {
    const history = progressHistory.get(event.verification_case_id) ?? [];
    history.push(event.to_status as VerificationCaseStatus);
    progressHistory.set(event.verification_case_id, history);
  }
  const grouped = groupOrder
    .map((group) => ({ group, cases: visibleCases.filter((item) => customerCaseGroup(item.workflow_status) === group) }))
    .filter((section) => section.cases.length > 0);

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Customer workspace</p>
          <h1>My cases</h1>
          <p className={styles.muted}>Search and continue your saved requests. Discarded drafts are not shown.</p>
        </div>
        <Link className={styles.button} href="/dashboard/cases/new">Start a new request</Link>
      </div>

      <form className={styles.caseFilters} aria-label="Filter your cases">
        <label htmlFor="case-search">Search
          <input id="case-search" name="q" type="search" defaultValue={search} placeholder="Case number, area or request details" />
        </label>
        <label htmlFor="case-status-filter">Status
          <select id="case-status-filter" name="status" defaultValue={filter}>
            {customerCaseFilters.map((value) => <option key={value} value={value}>{filterLabels[value]}</option>)}
          </select>
        </label>
        <button type="submit">Apply filters</button>
        {search || filter !== "all" ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/cases">Reset filters</Link> : null}
      </form>

      {error ? <p className={styles.error} role="alert">We could not load your cases.</p> : null}
      {!error && visibleCases.length === 0 ? (
        <div className={styles.empty}>
          <h2>{cases.length ? "No cases match these filters" : "No requests yet"}</h2>
          <p>{cases.length ? "Reset the filters or try a different search." : "Start with an Abuja/FCT site description."}</p>
          {cases.length ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/cases">Reset filters</Link> : <Link className={styles.button} href="/dashboard/cases/new">Start a new request</Link>}
        </div>
      ) : null}

      <div className={styles.caseGroups}>
        {grouped.map((section) => (
          <section key={section.group} aria-labelledby={`customer-cases-${section.group}`}>
            <div className={styles.cardHeader}>
              <h2 id={`customer-cases-${section.group}`}>{filterLabels[section.group]}</h2>
              <span className={styles.neutralMeta}>{section.cases.length}</span>
            </div>
            <div className={styles.grid}>
              {section.cases.map((item) => {
                const location = caseLocationDisplay(item.area_name, item.area_lga);
                return (
                  <article className={styles.card} key={item.id}>
                    <div className={styles.cardHeader}>
                      {item.is_demo_data ? <span className={styles.demo}>Demo</span> : <span />}
                      <CaseStatusBadge status={item.workflow_status} />
                    </div>
                    <p className={styles.eyebrow}>{item.case_number ?? "Not recorded"}</p>
                    <h2>{location.heading}</h2>
                    <p>{item.site_description}</p>
                    <CaseProgress status={item.workflow_status} history={progressHistory.get(item.id) ?? []} compact />
                    <p className={styles.muted}>{nextActionLabel(item.workflow_status)}</p>
                    <Link className={styles.link} href={`/dashboard/cases/${item.id}`}>
                      {item.workflow_status === "draft" ? "Continue draft" : "Open case"}
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
