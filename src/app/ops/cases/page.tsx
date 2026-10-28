import Link from "next/link";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { requireStaff } from "@/lib/auth/guards";
import { verificationCaseStatuses, type VerificationCase } from "@/types/verification";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";
import { formatCustomerIntent } from "@/lib/verification-cases/intake-labels";
import { groupStaffCases, STAFF_DASHBOARD_CARD_LIMIT } from "@/lib/verification-cases/staff-queue";

export const dynamic = "force-dynamic";

const departments = ["Verification", "Feasibility", "Operations"] as const;

export default async function CaseQueuePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; department?: string; group?: string }> }>) {
  const { supabase, staff } = await requireStaff();
  const filters = await searchParams;
  const status = verificationCaseStatuses.includes(filters.status as never)
    ? filters.status
    : undefined;
  const department = departments.includes(filters.department as never)
    ? filters.department
    : undefined;
  const reviewGroup = filters.group === "review";
  const filteredList = Boolean(status || department || reviewGroup);

  let query = supabase
    .from("verification_cases")
    .select("id, case_number, customer_user_id, created_by_user_id, creation_channel, jurisdiction, department, site_description, area_lga, area_name, area_is_listed, address_line, customer_intent, relationship_to_land, acting_for, principal_name, authority_confirmed, customer_notes, contact_preference, current_stage, workflow_status, assigned_lead_user_id, is_demo_data, created_at, updated_at")
    .neq("workflow_status", "draft")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("workflow_status", status);
  if (reviewGroup) query = query.in("workflow_status", ["assigned", "in_review"]);
  if (department) query = query.eq("department", department);
  const { data, error } = await query;
  const cases = (data ?? []) as VerificationCase[];
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", staff.user_id).maybeSingle();
  const columns = filteredList
    ? groupStaffCases(cases).filter((column) => column.cases.length > 0)
    : groupStaffCases(cases);

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{staff.department} department</p>
          <h1>{profile?.full_name ? `Good to see you, ${profile.full_name}` : staff.is_lead ? "Department work queue" : "My work queue"}</h1>
          <p className={styles.muted}>{staff.is_lead ? "Review the department queue and assign submitted cases manually." : "Cases currently assigned to you."}</p>
        </div>
        <span className={styles.demo}>Demo data · not official</span>
      </div>

      <div className={styles.statGrid} aria-label="Visible queue counts">
        <div className={styles.statCard}><strong>{cases.filter((item) => item.workflow_status === "submitted").length}</strong><span>Awaiting assignment</span></div>
        <div className={styles.statCard}><strong>{cases.filter((item) => item.workflow_status === "assigned" || item.workflow_status === "in_review").length}</strong><span>In review</span></div>
        <div className={styles.statCard}><strong>{cases.filter((item) => item.workflow_status === "needs_customer_info").length}</strong><span>Waiting on client</span></div>
      </div>

      <form className={styles.filterRow} aria-label="Queue filters">
        <label>Status
          <select name="status" defaultValue={status ?? ""}>
            <option value="">All visible statuses</option>
            {verificationCaseStatuses.filter((value) => value !== "draft").map((value) => (
              <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
        <label>Department
          <select name="department" defaultValue={department ?? ""}>
            <option value="">All visible departments</option>
            {departments.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="submit">Apply filters</button>
        {filteredList ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/ops/cases">Clear filters</Link> : null}
      </form>

      {error ? (
        <p className={styles.error} role="alert">The work queue could not be loaded.</p>
      ) : cases.length === 0 ? (
        <div className={styles.empty}>
          <h2>No visible cases</h2>
          <p>RLS limits this queue to your department or active assignments.</p>
        </div>
      ) : (
        <div className={styles.queueBoard}>
          {columns.map((column) => (
            <section className={styles.queueColumn} key={column.key} aria-labelledby={`queue-${column.key}`}>
              <div className={styles.queueColumnHeader}>
                <h2 id={`queue-${column.key}`}>{column.title}</h2>
                <span>{column.cases.length}</span>
              </div>
              {column.cases.length ? (filteredList ? column.cases : column.cases.slice(0, STAFF_DASHBOARD_CARD_LIMIT)).map((item) => {
                const location = caseLocationDisplay(item.area_name, item.area_lga);
                return (
                  <article className={styles.queueCard} key={item.id}>
                    <div className={styles.cardHeader}>{item.is_demo_data ? <span className={styles.demo}>Demo</span> : <span />}<CaseStatusBadge status={item.workflow_status} /></div>
                    <p className={styles.eyebrow}>{item.case_number ?? "Not recorded"}</p>
                    <h3>{location.heading}</h3>
                    <p className={styles.muted}>{formatCustomerIntent(item.customer_intent)} · {item.department}</p>
                    <p>{item.site_description}</p>
                    <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/ops/cases/${item.id}`}>Open case</Link>
                  </article>
                );
              }) : <p className={styles.queueEmpty}>No cases in this group.</p>}
              {!filteredList ? (
                <Link
                  className={styles.queueViewAll}
                  href={column.groupFilter ? `/ops/cases?group=${column.groupFilter}` : `/ops/cases?status=${column.statusFilter}`}
                >
                  View all {column.title.toLowerCase()}
                </Link>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
