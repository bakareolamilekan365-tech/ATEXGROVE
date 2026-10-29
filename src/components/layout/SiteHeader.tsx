import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { SiteNavigation, type SiteHeaderState } from "@/components/layout/SiteNavigation";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export type { SiteHeaderState } from "@/components/layout/SiteNavigation";

export function SiteHeader({
  state,
  accountName,
  department,
  isLead,
  registrationEnabled = true,
}: Readonly<{
  state: SiteHeaderState;
  accountName?: string | null;
  department?: string | null;
  isLead?: boolean;
  registrationEnabled?: boolean;
  current?: "home" | "login" | "cases" | "queue";
}>) {
  const profileHref = state === "staff" ? "/ops/profile" : "/dashboard/profile";
  const settingsHref = state === "staff" ? "/ops/settings" : "/dashboard/settings";
  const roleLabel = state === "staff" ? `${department || "Operations"} · ${isLead ? "Lead" : "Member"}` : "Customer";

  return (
    <header className="site-header">
      <div className={`site-header__inner ${state === "staff" ? "site-header__inner--staff" : ""}`}>
        <Link className="site-brand" href={state === "staff" ? "/ops/cases" : state === "customer" ? "/dashboard" : "/"} aria-label="Atexgrove home">
          <Image className="site-brand__mark" src="/logo/atexgrove-mark.svg" alt="" width={44} height={44} priority />
          <Image className="site-brand__wordmark" src="/logo/atexgrove-wordmark.svg" alt="Atexgrove" width={150} height={41} priority />
        </Link>

        <SiteNavigation state={state} registrationEnabled={registrationEnabled} />
        <ThemeSwitcher />

        {state !== "signed-out" ? (
          <div className="site-account">
            <details className="account-menu">
              <summary className="account-avatar" aria-label="Open account menu" title="Open account menu">
                {(accountName?.trim().charAt(0) || (state === "staff" ? "S" : "C")).toLocaleUpperCase()}
              </summary>
              <div className="account-menu__panel">
                <div className="account-menu__identity">
                  <strong>{accountName || (state === "staff" ? "Staff member" : "Customer")}</strong>
                  <span>{roleLabel}</span>
                </div>
                {state === "staff" ? <span className="status-tag status-tag--verification">Staff</span> : null}
                <Link href={profileHref}>Profile</Link>
                <Link href={settingsHref}>Settings</Link>
                <form action={signOutAction}>
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </details>
          </div>
        ) : null}
      </div>
    </header>
  );
}
