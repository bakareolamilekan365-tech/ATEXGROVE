import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export type SiteHeaderState = "signed-out" | "customer" | "staff";

export function SiteHeader({
  state,
  accountName,
  department,
  isLead,
  registrationEnabled = true,
  current,
}: Readonly<{
  state: SiteHeaderState;
  accountName?: string | null;
  department?: string | null;
  isLead?: boolean;
  registrationEnabled?: boolean;
  current?: "home" | "login" | "cases" | "queue";
}>) {
  return (
    <header className="site-header">
      <div className={`site-header__inner ${state === "staff" ? "site-header__inner--staff" : ""}`}>
        <Link className="site-brand" href={state === "staff" ? "/ops/cases" : state === "customer" ? "/dashboard" : "/"} aria-label="Atexgrove home">
          <Image src="/logo/atexgrove-mark.svg" alt="" width={44} height={44} priority />
          <Image className="site-brand__wordmark" src="/logo/atexgrove-wordmark.svg" alt="Atexgrove" width={150} height={41} priority />
        </Link>

        <nav className="site-nav" aria-label={state === "staff" ? "Staff navigation" : "Main navigation"}>
          {state === "signed-out" ? (
            <>
              <Link className="nav-pill" href="/" aria-current={current === "home" ? "page" : undefined}>Home</Link>
              <Link className="nav-pill" href="/#how-it-works">How it works</Link>
              <Link className="nav-pill" href="/#help">Help</Link>
              <Link className="nav-pill" href="/#contact">Contact</Link>
              <Link className="nav-pill" href="/login" aria-current={current === "login" ? "page" : undefined}>Log in</Link>
              {registrationEnabled ? <Link className="button button--primary" href="/register">Create account</Link> : null}
            </>
          ) : state === "customer" ? (
            <>
              <Link className="nav-pill" href="/dashboard">Home</Link>
              <Link className="nav-pill" href="/dashboard" aria-current={current === "cases" ? "page" : undefined}>My cases</Link>
              <Link className="nav-pill" href="/dashboard/help">Help</Link>
              <Link className="nav-pill" href="/dashboard/settings">Settings</Link>
            </>
          ) : (
            <>
              <Link className="nav-pill" href="/ops/cases" aria-current={current === "queue" ? "page" : undefined}>My queue</Link>
              <Link className="nav-pill" href="/dashboard">Customer dashboard</Link>
              <Link className="nav-pill" href="/ops/settings">Settings</Link>
            </>
          )}
        </nav>

        <ThemeSwitcher />

        {state !== "signed-out" ? (
          <div className="site-account">
            <Link className="site-account__identity" href={state === "staff" ? "/ops/profile" : "/dashboard/profile"} aria-label="Open your profile">
              <strong>{accountName || (state === "staff" ? "Staff member" : "Customer")}</strong>
              <span>{state === "staff" ? `${department || "Operations"} · ${isLead ? "Lead" : "Member"}` : "Customer"}</span>
            </Link>
            <Link className="account-avatar" href={state === "staff" ? "/ops/profile" : "/dashboard/profile"} aria-label="Open your profile" title="Open your profile">{(accountName?.trim().charAt(0) || (state === "staff" ? "S" : "C")).toLocaleUpperCase()}</Link>
            {state === "staff" ? <span className="status-tag status-tag--verification">Staff</span> : null}
            <form action={signOutAction}>
              <button className="button button--secondary" type="submit">Sign out</button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
