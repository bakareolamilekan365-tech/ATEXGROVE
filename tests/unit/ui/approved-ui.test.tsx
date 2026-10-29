import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import RegisterPage from "@/app/(auth)/register/page";
import { PreviewBanner, PRIVATE_PREVIEW_MESSAGE } from "@/components/layout/PreviewBanner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { SiteNavigation } from "@/components/layout/SiteNavigation";
import { publicRegistrationEnabled } from "@/lib/config/private-preview";

type Element = ReactElement<Record<string, unknown>>;

function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children)];
}

function text(node: unknown): string {
  if (typeof node === "string") return node;
  return elements(node).flatMap((element) => element.props.children).map(text).join(" ");
}

function links(node: unknown) {
  return elements(node).filter((element) => typeof element.props.href === "string").map((element) => element.props.href);
}

describe("approved shared UI", () => {
  const originalPreview = process.env.NEXT_PUBLIC_PRIVATE_PREVIEW;
  afterEach(() => { process.env.NEXT_PUBLIC_PRIVATE_PREVIEW = originalPreview; });

  it("shows only the approved signed-out navigation", () => {
    const header = SiteHeader({ state: "signed-out", registrationEnabled: true });
    const navigation = SiteNavigation({ state: "signed-out", registrationEnabled: true });
    expect(links(navigation)).toEqual(expect.arrayContaining(["/", "/#how-it-works", "/#help", "/#contact", "/login", "/register"]));
    expect(text(navigation)).toContain("Create account");
    expect(elements(header).some(({ props }) => props.src === "/logo/atexgrove-mark.svg")).toBe(true);
    expect(elements(header).some(({ props }) => props.src === "/logo/atexgrove-wordmark.svg")).toBe(true);
  });

  it("shows customer navigation and identity without staff routes", () => {
    const header = SiteHeader({ state: "customer", accountName: "Test Customer" });
    const navigation = SiteNavigation({ state: "customer", registrationEnabled: true });
    expect(links(navigation)).toEqual(expect.arrayContaining(["/dashboard", "/dashboard/cases", "/dashboard/help"]));
    const accountMenu = elements(header).find((element) => element.type === AccountMenu);
    expect(accountMenu?.props.profileHref).toBe("/dashboard/profile");
    expect(accountMenu?.props.accountName).toBe("Test Customer");
    expect(links(navigation)).not.toContain("/ops/cases");
    expect(accountMenu?.props.roleLabel).toBe("Customer");
  });

  it("shows the real staff queue and supported customer-workspace link", () => {
    const header = SiteHeader({ state: "staff", accountName: "Test Staff", department: "Verification", isLead: true });
    const navigation = SiteNavigation({ state: "staff", registrationEnabled: true });
    expect(links(navigation)).toEqual(expect.arrayContaining(["/ops/cases", "/dashboard"]));
    const accountMenu = elements(header).find((element) => element.type === AccountMenu);
    expect(accountMenu?.props.profileHref).toBe("/ops/profile");
    expect(accountMenu?.props.settingsHref).toBe("/ops/settings");
    expect(accountMenu?.props.roleLabel).toContain("Verification");
    expect(accountMenu?.props.roleLabel).toContain("Lead");
    expect(text(header)).not.toMatch(/Records|Team|Handovers/);
  });

  it("shows the preview banner only when enabled", () => {
    expect(text(PreviewBanner({ enabled: true }))).toContain(PRIVATE_PREVIEW_MESSAGE);
    expect(PreviewBanner({ enabled: false })).toBeNull();
  });

  it("removes public registration controls in private-preview mode", () => {
    process.env.NEXT_PUBLIC_PRIVATE_PREVIEW = "true";
    expect(publicRegistrationEnabled()).toBe(false);
    expect(text(SiteNavigation({ state: "signed-out", registrationEnabled: false }))).not.toContain("Create account");
    const page = RegisterPage();
    expect(page.props.title).toBe("Approved accounts only");
    expect(text(page)).not.toContain("Full name");
  });

  it("keeps login logic on the dedicated route and presents account-access links on the landing page", () => {
    const home = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    const login = readFileSync(resolve(process.cwd(), "src/app/(auth)/login/page.tsx"), "utf8");
    expect(home).not.toContain('import { LoginForm } from "@/components/auth/LoginForm"');
    expect(login).toContain('import { LoginForm } from "@/components/auth/LoginForm"');
    expect(home).not.toContain("<LoginForm");
    expect(home).toContain('href="/login"');
    expect(home).toContain('href="/register"');
    expect(login).toContain("<LoginForm");
  });
});
