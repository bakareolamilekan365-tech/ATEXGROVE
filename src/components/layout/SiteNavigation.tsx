"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ActiveNavLink } from "@/components/layout/ActiveNavLink";

export type SiteHeaderState = "signed-out" | "customer" | "staff";

export function navigationItems(state: SiteHeaderState, registrationEnabled: boolean) {
  if (state === "signed-out") return [
    { href: "/", label: "Home" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#help", label: "Help" },
    { href: "/#contact", label: "Contact" },
    { href: "/login", label: "Log in" },
    ...(registrationEnabled ? [{ href: "/register", label: "Create account", primary: true }] : []),
  ];
  if (state === "customer") return [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/cases", label: "My cases" },
    { href: "/dashboard/help", label: "Help" },
  ];
  return [
    { href: "/ops/cases", label: "My queue" },
    { href: "/dashboard", label: "Customer dashboard" },
  ];
}

export function SiteNavigation({ state, registrationEnabled }: Readonly<{ state: SiteHeaderState; registrationEnabled: boolean }>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [open]);

  return <div className="site-navigation" ref={wrapper}>
    <button ref={trigger} className="site-nav-trigger" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((current) => !current)}>
      <span>Menu</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={open ? "M5 5l14 14M19 5 5 19" : "M4 7h16M4 12h16M4 17h16"} /></svg>
    </button>
    <nav id={id} className={`site-nav ${open ? "site-nav--open" : ""}`} aria-label={state === "staff" ? "Staff navigation" : "Main navigation"}>
      {navigationItems(state, registrationEnabled).map((item, index) => item.primary
        ? <Link key={item.href} ref={index === 0 ? firstLink : undefined} className="button button--primary" href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
        : <span key={item.href} ref={index === 0 ? (element) => { firstLink.current = element?.querySelector("a") ?? null; } : undefined} className="site-nav__item"><ActiveNavLink href={item.href} onClick={() => setOpen(false)}>{item.label}</ActiveNavLink></span>)}
    </nav>
  </div>;
}
