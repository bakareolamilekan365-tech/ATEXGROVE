import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { accountMenuShouldCloseForKey, accountMenuShouldCloseForPointer } from "@/components/layout/AccountMenu";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { initialsFromName } from "@/lib/ui/identity";

vi.mock("@/app/actions", () => ({ signOutAction: vi.fn() }));

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

  it("keeps the sign-out form mounted while its server action is submitted", () => {
    const form = SignOutButton({ userId: "customer-1" }) as ReactElement<{ onSubmit?: () => void; children: ReactElement<{ onClick?: () => void }> }>;
    expect(form.type).toBe("form");
    expect(form.props.onSubmit).toBeTypeOf("function");
    expect(form.props.children.type).toBe("button");
    expect(form.props.children.props.onClick).toBeUndefined();
  });
});
