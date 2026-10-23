import Link from "next/link";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { requireStaff } from "@/lib/auth/guards";
import { verificationCaseStatuses, type VerificationCase } from "@/types/verification";

export const dynamic = "force-dynamic";

const departments = ["Verification", "Feasibility", "Operations"] as const;

export default async function CaseQueuePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; department?: string }> }>) {
  const { supabase, staff } = await requireStaff();
  const filters = await searchParams;
  const status = verificationCaseStatuses.includes(filters.status as never)
    ? filters.status
    : undefined;
  const department = departments.includes(filters.department as never)
    ? filters.department
    : undefined;

  let query = supabase
    .from("verification_cases")
    .select("id, customer_user_id, created_by_user_id, creation_channel, jurisdiction, department, site_description, area_lga, customer_notes, contact_preference, current_stage, workflow_status, assigned_lead_user_id, is_demo_data, created_at, updated_at")
    .neq("workflow_status", "draft")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("workflow_status", status);
  if (department) query = query.eq("department", department);
  const { data, error } = await query;
  const cases = (data ?? []) as VerificationCase[];

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{staff.department} department</p>
          <h1>{staff.is_lead ? "Department work queue" : "My work queue"}</h1>
          <p className={styles.muted}>Manual assignment and recorded status changes only.</p>
        </div>
        <span className={styles.demo}>Demo data · not official</span>
      </div>

      <form className={styles.filterRow}>
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
      </form>

      {error ? (
        <p className={styles.error} role="alert">The work queue could not be loaded.</p>
      ) : cases.length === 0 ? (
        <div className={styles.empty}>
          <h2>No visible cases</h2>
          <p>RLS limits this queue to your department or active assignments.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {cases.map((item) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.cardHeader}>
                <span className={styles.demo}>Demo</span>
                <CaseStatusBadge status={item.workflow_status} />
              </div>
              <p className={styles.eyebrow}>{item.department} · {item.id.slice(0, 8)}</p>
              <h2>{item.area_lga}, Abuja</h2>
              <p>{item.site_description}</p>
              <p className={`${styles.muted} ${styles.small}`}>Customer {item.customer_user_id.slice(0, 8)}</p>
              <Link className={styles.link} href={`/ops/cases/${item.id}`}>Open case</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
