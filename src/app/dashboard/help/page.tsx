import Link from "next/link";
import styles from "@/components/cases/case-workflow.module.css";

export default function DashboardHelpPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.headerRow}>
        <div><p className={styles.eyebrow}>Customer help</p><h1>Using the private preview</h1></div>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard">Back to my cases</Link>
      </div>
      <div className={styles.stack}>
        <section className={styles.panel}><h2>Requests and case status</h2><p>Start with a private draft, check the site details and submit only when ready. Customer-safe milestones show when a request is received, assigned, under review, waiting for your information, closed or cancelled.</p></section>
        <section className={styles.panel}><h2>Evidence in the preview</h2><p>Use synthetic or properly redacted PDF, JPG or PNG files only. Saved evidence remains private from staff until you submit the case or send a requested reply. Uploading a file does not authenticate it.</p></section>
        <section className={styles.panel}><h2>Service boundary</h2><p>Atexgrove is not a government registry and the preview does not issue legal, cadastral or statutory certification. Approved company contact details are still awaiting confirmation.</p></section>
      </div>
    </main>
  );
}
