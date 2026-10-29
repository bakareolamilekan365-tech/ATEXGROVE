import Link from "next/link";
import { redirect } from "next/navigation";
import { NewCaseForm } from "@/components/cases/NewCaseForm";
import styles from "@/components/cases/case-workflow.module.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewVerificationCasePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const idempotencyKey = crypto.randomUUID();

  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Verification case · Step 1</p>
          <h1>Start a land-verification request</h1>
          <p className={styles.muted}>Abuja/FCT controlled pilot · request details only</p>
        </div>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard">Back to dashboard</Link>
      </div>
      <section className={styles.panel} aria-labelledby="request-form-heading">
        <h2 id="request-form-heading">Tell us about the site</h2>
          <p className={styles.muted}>No parcel or marketplace listing is required. Save the request as a draft, then add documents before submitting it.</p>
        <NewCaseForm idempotencyKey={idempotencyKey} userId={user.id} />
      </section>
    </main>
  );
}
