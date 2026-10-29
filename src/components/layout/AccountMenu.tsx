"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {initialsFromName(accountName, fallbackInitial)}
      </button>
      {open ? (
        <div className="account-menu__panel" role="menu" aria-label="Account options">
          <div className="account-menu__identity">
            <strong>{accountName || (fallbackInitial === "S" ? "Staff member" : "Customer")}</strong>
            <span>{roleLabel}</span>
          </div>
          <Link ref={firstLinkRef} role="menuitem" href={profileHref} onClick={close}>Profile</Link>
          <Link role="menuitem" href={settingsHref} onClick={close}>Settings</Link>
          <SignOutButton userId={accountUserId} />
        </div>
      ) : null}
    </div>
  );
}
