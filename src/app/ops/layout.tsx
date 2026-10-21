import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import styles from "@/components/cases/case-workflow.module.css";
import { AuthorizationError, requireStaff } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function OperationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/dashboard");
    throw error;
  }

  return (
    <>
      <header className={styles.opsNav}>
        <Link className={styles.brand} href="/" aria-label="Atexgrove home">
          <Image
            className={styles.brandMark}
            src="/logo/atexgrove-mark.svg"
            alt="Atexgrove mark"
            width={40}
            height={40}
            priority
          />
          <span>Atexgrove Operations</span>
        </Link>
        <nav aria-label="Operations">
          <Link className={styles.link} href="/ops/cases">My queue</Link>
          <Link className={styles.link} href="/dashboard">Customer dashboard</Link>
        </nav>
      </header>
      {children}
    </>
  );
}
