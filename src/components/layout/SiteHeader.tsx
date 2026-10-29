import Image from "next/image";
import Link from "next/link";
import { SiteNavigation, type SiteHeaderState } from "@/components/layout/SiteNavigation";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export type { SiteHeaderState } from "@/components/layout/SiteNavigation";

export function SiteHeader({
  state,
  accountName,
  accountUserId,
  department,
  isLead,
  registrationEnabled = true,
}: Readonly<{
  state: SiteHeaderState;
  accountName?: string | null;
  accountUserId?: string;
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
            <AccountMenu
              accountName={accountName}
              accountUserId={accountUserId}
              roleLabel={roleLabel}
              profileHref={profileHref}
              settingsHref={settingsHref}
              fallbackInitial={state === "staff" ? "S" : "C"}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
