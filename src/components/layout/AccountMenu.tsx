"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type Ref } from "react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { initialsFromName } from "@/lib/ui/identity";

export function accountMenuShouldCloseForPointer(
  root: Pick<Node, "contains"> | null,
  target: Node,
) {
  return Boolean(root && !root.contains(target));
}

export function accountMenuShouldCloseForKey(key: string) {
  return key === "Escape";
}

export function AccountMenuPanel({
  accountName,
  accountUserId,
  roleLabel,
  profileHref,
  settingsHref,
  fallbackInitial,
  firstLinkRef,
  onNavigate,
}: Readonly<{
  accountName?: string | null;
  accountUserId?: string;
  roleLabel: string;
  profileHref: string;
  settingsHref: string;
  fallbackInitial: string;
  firstLinkRef?: Ref<HTMLAnchorElement>;
  onNavigate: () => void;
}>) {
  return (
    <nav className="account-menu__panel" aria-label="Account options">
      <div className="account-menu__identity">
        <strong>{accountName || (fallbackInitial === "S" ? "Staff member" : "Customer")}</strong>
        <span>{roleLabel}</span>
      </div>
      <Link ref={firstLinkRef} href={profileHref} onClick={onNavigate}>Profile</Link>
      <Link href={settingsHref} onClick={onNavigate}>Settings</Link>
      <SignOutButton userId={accountUserId} />
    </nav>
  );
}

export function AccountMenu({
  accountName,
  accountUserId,
  roleLabel,
  profileHref,
  settingsHref,
  fallbackInitial,
}: Readonly<{
  accountName?: string | null;
  accountUserId?: string;
  roleLabel: string;
  profileHref: string;
  settingsHref: string;
  fallbackInitial: string;
}>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (accountMenuShouldCloseForPointer(rootRef.current, event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!accountMenuShouldCloseForKey(event.key)) return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div className="account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        className="account-avatar"
        type="button"
        aria-label={open ? "Close account menu" : "Open account menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {initialsFromName(accountName, fallbackInitial)}
      </button>
      {open ? (
        <AccountMenuPanel
          accountName={accountName}
          accountUserId={accountUserId}
          roleLabel={roleLabel}
          profileHref={profileHref}
          settingsHref={settingsHref}
          fallbackInitial={fallbackInitial}
          firstLinkRef={firstLinkRef}
          onNavigate={close}
        />
      ) : null}
    </div>
  );
}
