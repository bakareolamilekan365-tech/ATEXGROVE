import Link from "next/link";
import { redirect } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { AuthorizationError, requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customerCaseCounts } from "@/lib/verification-cases/customer-cases";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";
import { nextActionLabel } from "@/lib/verification-cases/next-action";
import { timelineEventHeading } from "@/lib/verification-cases/status";
import type { CaseStatusEvent, StaffMember, VerificationCase } from "@/types/verification";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ request?: string; signout?: string }> }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: caseData, error: casesError }] = await Promise.all([
    supabase.from("profiles").select("full_name, account_type").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("verification_cases")
      .select("id, case_number, customer_user_id, created_by_user_id, creation_channel, jurisdiction, department, site_description, area_lga, area_name, area_is_listed, address_line, contact_phone, contact_phone_consent, customer_notes, contact_preference, current_stage, workflow_status, assigned_lead_user_id, is_demo_data, idempotency_key, discarded_at, customer_intent, relationship_to_land, acting_for, principal_name, authority_confirmed, information_request_event_id, created_at, updated_at")
      .eq("customer_user_id", user.id)
      .is("discarded_at", null)
      .order("updated_at", { ascending: false }),
  ]);
  const cases = (caseData ?? []) as VerificationCase[];
  const counts = customerCaseCounts(cases);
  const waitingCases = cases.filter((item) => item.workflow_status === "needs_customer_info");
  const drafts = cases.filter((item) => item.workflow_status === "draft");
  const active = cases.filter((item) => ["submitted", "assigned", "in_review"].includes(item.workflow_status));
  const caseById = new Map(cases.map((item) => [item.id, item]));
  const { data: activityData } = cases.length
    ? await supabase
        .from("case_status_events")
        .select("*")
        .eq("customer_visible", true)
        .in("verification_case_id", cases.map((item) => item.id))
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] as CaseStatusEvent[] };

  let staff: StaffMember | null = null;
  try {
    staff = (await requireStaff()).staff;
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
  }

  const { request, signout } = await searchParams;
  return (
    <main className={styles.shell}>
      <section className={styles.dashboardHero}>
        <div>
          <p className={styles.eyebrow}>Customer home</p>
          <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
          <p className={styles.muted}>
            {waitingCases.length
              ? `${waitingCases.length} ${waitingCases.length === 1 ? "request needs" : "requests need"} your attention.`
              : active.length
                ? `${active.length} ${active.length === 1 ? "request is" : "requests are"} currently in progress.`
                : "Start a request or continue a saved draft when you are ready."}
          </p>
        </div>
        <div className={styles.actions}>
          {staff ? <a className={`${styles.button} ${styles.buttonSecondary}`} href="/ops/cases">Staff workspace</a> : null}
          <Link className={styles.button} href="/dashboard/cases/new">Start a new request</Link>
        </div>
      </section>

      {request === "submitted" ? <p className={styles.success} role="status">Request received. It is not yet verified and will enter the staff queue.</p> : null}
      {signout === "failed" ? <p className={styles.error} role="alert">We could not sign you out. Your session is still active. Please try again.</p> : null}

      <section className={styles.statGrid} aria-label="Your case summary">
        <Link className={styles.statCard} href="/dashboard/cases?status=active"><strong>{counts.active}</strong><span>In progress</span></Link>
        <Link className={styles.statCard} href="/dashboard/cases?status=waiting"><strong>{counts.waiting}</strong><span>Waiting on you</span></Link>
        <Link className={styles.statCard} href="/dashboard/cases?status=draft"><strong>{counts.draft}</strong><span>Saved drafts</span></Link>
      </section>

      <div className={styles.dashboardOverview}>
        <section className={styles.panel}>
          <div className={styles.cardHeader}>
            <div><p className={styles.eyebrow}>Next steps</p><h2>Requests requiring action</h2></div>
            <Link className={styles.link} href="/dashboard/cases?status=waiting">View all</Link>
          </div>
          {waitingCases.length ? (
            <div className={styles.stack}>
              {waitingCases.slice(0, 3).map((item) => {
                const location = caseLocationDisplay(item.area_name, item.area_lga);
                return <article className={styles.summaryRow} key={item.id}>
                  <div><strong>{location.heading}</strong><span>{item.case_number ?? "Not recorded"}</span></div>
                  <CaseStatusBadge status={item.workflow_status} />
                  <Link className={styles.link} href={`/dashboard/cases/${item.id}`}>Respond</Link>
                </article>;
              })}
            </div>
          ) : <p className={styles.empty}>Nothing needs your response right now.</p>}
        </section>

        <section className={styles.panel}>
          <div className={styles.cardHeader}>
            <div><p className={styles.eyebrow}>Saved work</p><h2>Active drafts</h2></div>
            <Link className={styles.link} href="/dashboard/cases?status=draft">View all</Link>
          </div>
          {drafts.length ? (
            <div className={styles.stack}>
              {drafts.slice(0, 3).map((item) => (
                <article className={styles.summaryRow} key={item.id}>
                  <div><strong>{caseLocationDisplay(item.area_name, item.area_lga).heading}</strong><span>{nextActionLabel(item.workflow_status)}</span></div>
                  <Link className={styles.link} href={`/dashboard/cases/${item.id}`}>Continue draft</Link>
                </article>
              ))}
            </div>
          ) : <p className={styles.empty}>You have no saved drafts.</p>}
        </section>

        <section className={`${styles.panel} ${styles.activityPanel}`}>
          <div className={styles.cardHeader}>
            <div><p className={styles.eyebrow}>Latest updates</p><h2>Recent activity</h2></div>
            <Link className={styles.link} href="/dashboard/cases">Open My cases</Link>
          </div>
          {(activityData ?? []).length ? (
            <ol className={styles.timeline}>
              {((activityData ?? []) as CaseStatusEvent[]).map((event) => {
                const item = caseById.get(event.verification_case_id);
                return <li key={event.id} data-kind={event.event_kind}>
                  <strong>{timelineEventHeading(event)}</strong>
                  <p>{item?.case_number ?? "Case update"}</p>
                  <time className={`${styles.muted} ${styles.small}`} dateTime={event.created_at}>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(event.created_at))}</time>
                  {item ? <Link className={styles.link} href={`/dashboard/cases/${item.id}`}>Open case</Link> : null}
                </li>;
              })}
            </ol>
          ) : <p className={styles.empty}>No customer-visible activity yet.</p>}
        </section>
      </div>

      {casesError ? <p className={styles.error} role="alert">We could not load your case summary.</p> : null}
    </main>
  );
}
