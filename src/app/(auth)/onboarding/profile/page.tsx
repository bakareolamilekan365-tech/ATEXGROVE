import { ProfileForm } from "@/components/profile/ProfileForm";
import styles from "@/components/cases/case-workflow.module.css";

export default function ProfilePage() {
  return (
    <main className={styles.shell}>
      <ProfileForm />
    </main>
  );
}
