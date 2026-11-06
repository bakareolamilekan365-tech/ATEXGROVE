import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu, AccountMenuPanel, accountMenuShouldCloseForKey, accountMenuShouldCloseForPointer } from "@/components/layout/AccountMenu";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { initialsFromName } from "@/lib/ui/identity";

vi.mock("@/app/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

describe("account menu", () => {
  it("derives first-name and surname initials with safe fallbacks", () => {
    expect(initialsFromName("Olamilekan Bakare", "C")).toBe("OB");
    expect(initialsFromName("Olamilekan Abdulkarim Bakare", "C")).toBe("OB");
    expect(initialsFromName("Olamilekan", "C")).toBe("O");
    expect(initialsFromName("", "C")).toBe("C");
  });

  it("closes for an outside pointer target but not an inside target", () => {
    const inside = {} as Node;
    const outside = {} as Node;
    const root = { contains: (target: Node | null) => target === inside };
    expect(accountMenuShouldCloseForPointer(root, outside)).toBe(true);
    expect(accountMenuShouldCloseForPointer(root, inside)).toBe(false);
  });

  it("closes on Escape without treating other keys as dismissal", () => {
    expect(accountMenuShouldCloseForKey("Escape")).toBe(true);
    expect(accountMenuShouldCloseForKey("Enter")).toBe(false);
  });

  it("uses a native disclosure button and ordinary navigation, not an incomplete ARIA menu", () => {
    const props = {
      accountName: "Test Customer",
      roleLabel: "Customer",
      profileHref: "/dashboard/profile",
      settingsHref: "/dashboard/settings",
      fallbackInitial: "C",
    };
    const closed = renderToStaticMarkup(createElement(AccountMenu, props));
    expect(closed).toContain('aria-label="Open account menu"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain('type="button"');
    expect(closed).not.toContain('aria-haspopup="menu"');

    const panel = renderToStaticMarkup(createElement(AccountMenuPanel, { ...props, onNavigate: () => {} }));
    expect(panel).toContain('<nav');
    expect(panel).toContain('aria-label="Account options"');
    expect(panel).toContain('href="/dashboard/profile"');
    expect(panel).toContain('href="/dashboard/settings"');
    expect(panel).toContain('Sign out');
    expect(panel).toContain('<form');
    expect(panel).not.toContain('role="menu"');
    expect(panel).not.toContain('role="menuitem"');
  });

  it("keeps the sign-out form mounted while its server action is submitted", () => {
    const form = SignOutButton({ userId: "customer-1" }) as ReactElement<{ onSubmit?: () => void; children: ReactElement<{ onClick?: () => void }> }>;
    expect(form.type).toBe("form");
    expect(form.props.onSubmit).toBeTypeOf("function");
    expect(form.props.children.type).toBe("button");
    expect(form.props.children.props.onClick).toBeUndefined();
  });
});
