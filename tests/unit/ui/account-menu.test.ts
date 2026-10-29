import { describe, expect, it } from "vitest";
import { accountMenuShouldCloseForKey, accountMenuShouldCloseForPointer } from "@/components/layout/AccountMenu";
import { initialsFromName } from "@/lib/ui/identity";

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
});
