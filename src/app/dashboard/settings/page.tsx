import { ProfileForm } from "@/components/profile/ProfileForm";
import styles from "@/components/cases/case-workflow.module.css";

export default function DashboardSettingsPage() {
  return <main className={styles.shell}><ProfileForm title="Profile settings" /></main>;
}
