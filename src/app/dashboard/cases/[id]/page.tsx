import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { CaseProgress } from "@/components/cases/CaseProgress";
import { CustomerResponseForm } from "@/components/cases/CustomerResponseForm";
import { EvidenceChecklist } from "@/components/cases/EvidenceChecklist";
import { CustomerCaseControls } from "@/components/cases/CustomerCaseControls";
import styles from "@/components/cases/case-workflow.module.css";
import { evidenceTypeLabels } from "@/lib/case-evidence/validation";
import { caseTimelineEvents, timelineEventHeading, timelineEventKindForDisplay, timelineEventKindLabel } from "@/lib/verification-cases/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaseEvidence, CaseStatusEvent, VerificationCase } from "@/types/verification";
import { caseLocationDisplay } from "@/lib/verification-cases/location-display";
import { customerCaseActions } from "@/lib/verification-cases/customer-case-state";
import { nextActionLabel } from "@/lib/verification-cases/next-action";
import { formatActingFor, formatAuthorityConfirmation, formatCustomerIntent, formatRelationshipToLand } from "@/lib/verification-cases/intake-labels";

export const dynamic = "force-dynamic";

export default async function CustomerCasePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: caseData }, { data: eventData, error: eventError }, { data: evidenceData }] = await Promise.all([
    supabase.from("verification_cases").select("*").eq("id", id).eq("customer_user_id", user.id).maybeSingle(),
    supabase.from("case_status_events").select("*").eq("verification_case_id", id).eq("customer_visible", true).order("created_at", { ascending: false }),
    supabase.from("case_evidence").select("*").eq("verification_case_id", id).order("created_at", { ascending: false }),
  ]);
  if (!caseData) notFound();

  const item = caseData as VerificationCase;
  const events = caseTimelineEvents((eventData ?? []) as CaseStatusEvent[]);
  const evidence = (evidenceData ?? []) as CaseEvidence[];
  const customerActions = customerCaseActions(item.workflow_status);
  const location = caseLocationDisplay(item.area_name, item.area_lga);

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{item.case_number ?? "Not recorded"}</p>
          <h1>{location.heading}</h1>
          {location.note ? <p className={`${styles.muted} ${styles.small}`}>{location.note}</p> : null}
          <div className={styles.metaRow}>
            {item.is_demo_data ? <span className={styles.demo}>Demo data · not official</span> : null}
            <CaseStatusBadge status={item.workflow_status} />
          </div>
          <p className={styles.muted}>{nextActionLabel(item.workflow_status)}</p>
          <CaseProgress status={item.workflow_status} />
          {item.workflow_status === "draft" ? <p className={styles.notice}>This request is saved as a draft. Staff cannot see it until you submit it.</p> : null}
        </div>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard">Back to dashboard</Link>
      </div>

      <div className={styles.twoColumn}>
        <section className={styles.panel}>
          <h2>Case timeline</h2>
          <p className={styles.muted}>Only updates approved for customer viewing appear here.</p>
          <ol className={styles.timeline}>
            {events.map((event) => (
              <li key={event.id} data-kind={event.event_kind}>
                <strong>{timelineEventHeading(event)}</strong>
                <p className={`${styles.eyebrow} ${styles.small}`}>
                  {timelineEventKindLabel(timelineEventKindForDisplay(event))}
                </p>
                <p>{event.reason}</p>
                <time className={`${styles.muted} ${styles.small}`} dateTime={event.created_at}>
                  {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}
                </time>
              </li>
            ))}
          </ol>
          {eventError ? <p className={styles.error} role="alert">The timeline could not be loaded. Refresh to try again.</p> : null}
          {!eventError && events.length === 0 ? <p className={styles.empty}>No timeline activity yet.</p> : null}
        </section>
        <section className={styles.panel}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Private evidence</p>
              <h2>Document history ({evidence.length}/10)</h2>
            </div>
            {item.is_demo_data ? <span className={styles.demo}>Demo data / not official</span> : null}
          </div>
          <p className={styles.muted}>Submission for review does not authenticate any document.</p>
          {evidence.length ? (
            <div className={styles.stack}>
              {evidence.map((document) => {
                const predecessor = evidence.find((item) => item.id === document.supersedes_evidence_id);
                return <article className={styles.card} key={document.id}>
                  <strong>{evidenceTypeLabels[document.evidence_type]}</strong>
                  <p>{document.description}</p>
                  <p className={styles.notice}>{document.submitted_at ? "Submitted for review — not authenticated" : "Saved — not yet submitted to the review team"}</p>
                  <p className={`${styles.muted} ${styles.small}`}>Uploaded {new Date(document.created_at).toLocaleString("en-NG")}{document.submitted_at ? ` · Submitted ${new Date(document.submitted_at).toLocaleString("en-NG")}` : ""}</p>
                  <p className={`${styles.muted} ${styles.small}`}>{document.original_filename} · Version {document.version} · {(document.size_bytes / 1024).toFixed(1)} KB</p>
                  {predecessor ? <p className={`${styles.muted} ${styles.small}`}>Replacement for Version {predecessor.version} ({predecessor.original_filename})</p> : null}
                  <span className={styles.demo}>Demo data / not official</span>
                </article>
              })}
            </div>
          ) : <p className={styles.empty}>No documents added.</p>}
        </section>
        {customerActions.canUploadEvidence ? (
          <section className={styles.panel}>
            <h2>{item.workflow_status === "draft" ? "Document checklist" : "Add documents"}</h2>
            <EvidenceChecklist caseId={item.id} evidence={evidence} />
          </section>
        ) : null}
        <CustomerCaseControls caseId={item.id} status={item.workflow_status} />
        {item.workflow_status === "needs_customer_info" ? (
          <section className={styles.panel}>
            <h2>Respond to the review team</h2>
            {item.information_request_event_id ? <CustomerResponseForm caseId={item.id} requestEventId={item.information_request_event_id} /> : <p className={styles.error}>This request needs a review-team refresh before you can submit a response. Your saved files remain private.</p>}
          </section>
        ) : null}
        <aside className={styles.card}>
          <p className={styles.eyebrow}>{item.workflow_status === "draft" ? "Draft" : "Request received"}</p>
          <h2>Site details</h2>
          <p>{item.site_description}</p>
          <p><strong>Jurisdiction:</strong> {item.jurisdiction}</p>
          <p><strong>Area council:</strong> {item.area_lga}</p>
          <p><strong>Area:</strong> {item.area_name ?? "Not recorded"}</p>
          <p><strong>Area list status:</strong> {item.area_is_listed === null ? "Not recorded" : item.area_is_listed ? "Starter list" : "Customer-entered, not in starter list"}</p>
          <p><strong>Address:</strong> {item.address_line ?? "Not recorded"}</p>
          <p><strong>Contact:</strong> {item.contact_preference}</p>
          <h3>Your intake details · Your claims, not verified</h3>
          <p><strong>Intent:</strong> {formatCustomerIntent(item.customer_intent)}</p>
          <p><strong>Relationship to land:</strong> {formatRelationshipToLand(item.relationship_to_land)}</p>
          <p><strong>Request for:</strong> {formatActingFor(item.acting_for, item.principal_name)}</p>
          <p><strong>Authority confirmation:</strong> {formatAuthorityConfirmation(item.authority_confirmed, item.acting_for)}</p>
          <div className={styles.notice}>This workflow coordinates review. It is not government or statutory certification.</div>
        </aside>
      </div>
    </main>
  );
}
