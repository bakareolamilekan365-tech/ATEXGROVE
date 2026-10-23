import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { CustomerResponseForm } from "@/components/cases/CustomerResponseForm";
import { EvidenceUploadForm } from "@/components/cases/EvidenceUploadForm";
import styles from "@/components/cases/case-workflow.module.css";
import { evidenceTypeLabels } from "@/lib/case-evidence/validation";
import { caseStatusLabels, timelineEventKindLabel } from "@/lib/verification-cases/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaseEvidence, CaseStatusEvent, VerificationCase } from "@/types/verification";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";

export const dynamic = "force-dynamic";

export default async function CustomerCasePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: caseData }, { data: eventData }, { data: evidenceData }] = await Promise.all([
    supabase.from("verification_cases").select("*").eq("id", id).eq("customer_user_id", user.id).maybeSingle(),
    supabase.from("case_status_events").select("*").eq("verification_case_id", id).eq("customer_visible", true).order("created_at", { ascending: false }),
    supabase.from("case_evidence").select("*").eq("verification_case_id", id).order("created_at", { ascending: false }),
  ]);
  if (!caseData) notFound();

  const item = caseData as VerificationCase;
  const events = (eventData ?? []) as CaseStatusEvent[];
  const evidence = (evidenceData ?? []) as CaseEvidence[];
  const acceptsEvidence = ["submitted", "assigned", "in_review", "needs_customer_info"].includes(item.workflow_status);
  const location = caseLocationDisplay(item.area_name, item.area_lga);

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Case {item.id.slice(0, 8)}</p>
          <h1>{location.heading}</h1>
          {location.note ? <p className={`${styles.muted} ${styles.small}`}>{location.note}</p> : null}
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
                <p className={`${styles.eyebrow} ${styles.small}`}>
                  {timelineEventKindLabel(event.event_kind)}
                </p>
                <p>{event.reason}</p>
                <time className={`${styles.muted} ${styles.small}`} dateTime={event.created_at}>
                  {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}
                </time>
              </li>
            ))}
          </ol>
        </section>
        <section className={styles.panel}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Private evidence</p>
              <h2>Documents ({evidence.length}/10)</h2>
            </div>
            <span className={styles.demo}>Demo data / not official</span>
          </div>
          <p className={styles.muted}>Every file is received from customer — not authenticated.</p>
          {evidence.length ? (
            <div className={styles.stack}>
              {evidence.map((document) => (
                <article className={styles.card} key={document.id}>
                  <strong>{evidenceTypeLabels[document.evidence_type]}</strong>
                  <p>{document.description}</p>
                  <p className={`${styles.muted} ${styles.small}`}>{document.original_filename} · Version {document.version} · {(document.size_bytes / 1024).toFixed(1)} KB</p>
                  <span className={styles.demo}>Demo data / not official</span>
                </article>
              ))}
            </div>
          ) : <p className={styles.empty}>No documents added.</p>}
        </section>
        {acceptsEvidence ? (
          <section className={styles.panel}>
            <h2>Add document</h2>
            <EvidenceUploadForm
              caseId={item.id}
              existingEvidence={evidence.map((document) => ({
                id: document.id,
                evidenceType: document.evidence_type,
                version: document.version,
                filename: document.original_filename,
              }))}
            />
          </section>
        ) : null}
        {item.workflow_status === "needs_customer_info" ? (
          <section className={styles.panel}>
            <h2>Respond to the review team</h2>
            <CustomerResponseForm caseId={item.id} />
          </section>
        ) : null}
        <aside className={styles.card}>
          <p className={styles.eyebrow}>Request received</p>
          <h2>Site details</h2>
          <p>{item.site_description}</p>
          <p><strong>Jurisdiction:</strong> {item.jurisdiction}</p>
          <p><strong>Area council:</strong> {item.area_lga}</p>
          <p><strong>Area:</strong> {item.area_name ?? "Not recorded"}</p>
          <p><strong>Area list status:</strong> {item.area_is_listed === null ? "Not recorded" : item.area_is_listed ? "Starter list" : "Customer-entered, not in starter list"}</p>
          <p><strong>Address:</strong> {item.address_line ?? "Not recorded"}</p>
          <p><strong>Contact:</strong> {item.contact_preference}</p>
          <div className={styles.notice}>This workflow coordinates review. It is not government or statutory certification.</div>
        </aside>
      </div>
    </main>
  );
}
