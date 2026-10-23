import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { AuthorizationError, requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StaffMember, VerificationCase } from "@/types/verification";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ request?: string }> }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: cases, error: casesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, account_type, location_text, bio")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("verification_cases")
      .select("id, customer_user_id, created_by_user_id, creation_channel, jurisdiction, department, site_description, area_lga, area_name, area_is_listed, address_line, contact_phone, contact_phone_consent, customer_notes, contact_preference, current_stage, workflow_status, assigned_lead_user_id, is_demo_data, idempotency_key, created_at, updated_at")
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  let staff: StaffMember | null = null;
  try {
    staff = (await requireStaff()).staff;
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
  }

  const role = profile?.account_type ?? "buyer";
  const roleCopy: Record<string, string> = {
    buyer: "Submit and follow your land-verification requests in plain English.",
    landowner: "Submit and follow requests without claiming ownership has been verified.",
    developer: "Track early verification requests before later development workflows begin.",
    professional: "Your platform role is not professional verification. Staff access is granted separately.",
    admin: "Administrative account type is separate from the scoped staff work queue.",
  };
  const { request } = await searchParams;
  const ownCases = (cases ?? []) as VerificationCase[];

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Customer dashboard</p>
          <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
          <div className={styles.roleBadges} aria-label="Account access">
            <span className={styles.roleBadge}>Customer</span>
            {staff ? (
              <span className={styles.roleBadge}>
                Staff · {staff.department} · {staff.is_lead ? "Lead" : "Member"}
              </span>
            ) : null}
            <form action={signOutAction}><button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Sign out</button></form>
          </div>
          <p className={styles.muted}>{roleCopy[role] ?? "Your customer workspace."}</p>
        </div>
        <div className={styles.actions}>
          {staff ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/ops/cases">Staff workspace</Link> : null}
          <Link className={styles.button} href="/dashboard/cases/new">Start a new request</Link>
        </div>
      </div>

      {request === "submitted" ? (
        <p className={styles.success} role="status">
          Request received. It is not yet verified and will enter the staff queue.
        </p>
      ) : null}

      <div className={styles.cardHeader}>
        <h2>My cases</h2>
        <span className={styles.demo}>Demo data · not official</span>
      </div>

      {casesError ? (
        <p className={styles.error} role="alert">We could not load your cases.</p>
      ) : ownCases.length === 0 ? (
        <div className={styles.empty}>
          <h2>No requests yet</h2>
          <p>Start with an Abuja/FCT plot description.</p>
          <Link className={styles.button} href="/dashboard/cases/new">Start a new request</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {ownCases.map((item) => {
            const location = caseLocationDisplay(item.area_name, item.area_lga);
            return <article className={styles.card} key={item.id}>
              <div className={styles.cardHeader}>
                <span className={styles.demo}>Demo</span>
                <CaseStatusBadge status={item.workflow_status} />
              </div>
              <p className={styles.eyebrow}>Case {item.id.slice(0, 8)}</p>
              <h2>{location.heading}</h2>
              {location.note ? <p className={`${styles.muted} ${styles.small}`}>{location.note}</p> : null}
              <p>{item.site_description}</p>
              <p className={`${styles.muted} ${styles.small}`}>
                Received {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(item.created_at))}
              </p>
              <Link className={styles.link} href={`/dashboard/cases/${item.id}`}>See case timeline</Link>
            </article>
          })}
        </div>
      )}
    </main>
  );
}
