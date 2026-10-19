import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import styles from "@/components/cases/case-workflow.module.css";
import { caseStatusLabels } from "@/lib/verification-cases/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaseStatusEvent, VerificationCase } from "@/types/verification";

export const dynamic = "force-dynamic";

export default async function CustomerCasePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: caseData }, { data: eventData }] = await Promise.all([
    supabase.from("verification_cases").select("*").eq("id", id).maybeSingle(),
    supabase.from("case_status_events").select("*").eq("verification_case_id", id).eq("customer_visible", true).order("created_at", { ascending: false }),
  ]);
  if (!caseData) notFound();

  const item = caseData as VerificationCase;
  const events = (eventData ?? []) as CaseStatusEvent[];

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Case {item.id.slice(0, 8)}</p>
          <h1>{item.area_lga}, Abuja</h1>
          <div className={styles.metaRow}>
            <span className={styles.demo}>Demo data · not official</span>
            <CaseStatusBadge status={item.workflow_status} />
          </div>
        </div>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard">Back to dashboard</Link>
      </div>

      <div className={styles.twoColumn}>
        <section className={styles.panel}>
          <h2>Customer-safe timeline</h2>
          <p className={styles.muted}>Only updates approved for customer viewing appear here.</p>
          <ol className={styles.timeline}>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{caseStatusLabels[event.to_status]}</strong>
                <p>{event.reason}</p>
                <time className={`${styles.muted} ${styles.small}`} dateTime={event.created_at}>
                  {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}
                </time>
              </li>
            ))}
          </ol>
        </section>
        <aside className={styles.card}>
          <p className={styles.eyebrow}>Request received</p>
          <h2>Site details</h2>
          <p>{item.site_description}</p>
          <p><strong>Jurisdiction:</strong> {item.jurisdiction}</p>
          <p><strong>Contact:</strong> {item.contact_preference}</p>
          <div className={styles.notice}>This workflow coordinates review. It is not government or statutory certification.</div>
        </aside>
      </div>
    </main>
  );
}
