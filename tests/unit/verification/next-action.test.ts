import { describe, expect, it } from "vitest";
import { nextActionForCase, nextActionLabel } from "@/lib/verification-cases/next-action";

describe("customer next-action guidance", () => {
  it("identifies when the customer needs to act", () => {
    expect(nextActionForCase("draft")).toBe("customer");
    expect(nextActionForCase("needs_customer_info")).toBe("customer");
    expect(nextActionLabel("draft")).toBe("Action required from you");
  });

  it("identifies when Atexgrove is reviewing", () => {
    for (const status of ["submitted", "assigned", "in_review"] as const) {
      expect(nextActionForCase(status)).toBe("atexgrove");
      expect(nextActionLabel(status)).toBe("Atexgrove is reviewing");
    }
  });

  it("shows no action for completed or cancelled cases", () => {
    expect(nextActionForCase("closed")).toBe("none");
    expect(nextActionForCase("cancelled")).toBe("none");
    expect(nextActionLabel("closed")).toBe("No action required");
  });
});
