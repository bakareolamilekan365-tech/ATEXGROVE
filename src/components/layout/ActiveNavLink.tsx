"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ActiveNavLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  const current = href === "/dashboard#my-cases"
    ? pathname === "/dashboard" && hash === "#my-cases"
    : href === "/dashboard"
      ? pathname === href && hash !== "#my-cases"
      : href === "/ops/cases"
        ? pathname === href || pathname.startsWith(`${href}/`)
        : href === "/"
          ? pathname === href && !hash
          : href.startsWith("/#")
            ? pathname === "/" && hash === href.slice(1)
            : pathname === href;

  return <Link className="nav-pill" href={href} aria-current={current ? "page" : undefined}>{children}</Link>;
}
