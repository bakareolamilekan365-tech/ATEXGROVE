import Link from "next/link";
import { ActiveNavLink } from "@/components/layout/ActiveNavLink";

export type SiteHeaderState = "signed-out" | "customer" | "staff";

export function SiteNavigation({ state, registrationEnabled }: Readonly<{ state: SiteHeaderState; registrationEnabled: boolean }>) {
  const item = (href: string, label: string) => <ActiveNavLink href={href}>{label}</ActiveNavLink>;

  return (
    <nav className="site-nav" aria-label={state === "staff" ? "Staff navigation" : "Main navigation"}>
      {state === "signed-out" ? (
        <>
          {item("/", "Home")}
          {item("/#how-it-works", "How it works")}
          {item("/#help", "Help")}
          {item("/#contact", "Contact")}
          {item("/login", "Log in")}
          {registrationEnabled ? <Link className="button button--primary" href="/register">Create account</Link> : null}
        </>
      ) : state === "customer" ? (
        <>
          {item("/dashboard", "Home")}
          {item("/dashboard/cases", "My cases")}
          {item("/dashboard/help", "Help")}
        </>
      ) : (
        <>
          {item("/ops/cases", "My queue")}
          {item("/dashboard", "Customer dashboard")}
        </>
      )}
    </nav>
  );
}
