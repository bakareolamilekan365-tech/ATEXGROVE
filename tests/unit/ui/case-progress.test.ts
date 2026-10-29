import { describe, expect, it } from "vitest";
import { progressSteps } from "@/components/cases/CaseProgress";

describe("case progress", () => {
  it("does not show cancellation as completed work", () => {
    const steps = progressSteps("cancelled");
    expect(steps.at(-1)).toMatchObject({ label: "Cancelled — work stopped", state: "cancelled" });
    expect(steps.some((step) => step.state === "completed")).toBe(false);
  });

  it("highlights a customer information request in amber without inventing later completion", () => {
    const steps = progressSteps("needs_customer_info", ["submitted", "assigned", "in_review"]);
    expect(steps.at(-1)).toMatchObject({ state: "attention" });
    expect(steps.slice(0, 3).every((step) => step.state === "completed")).toBe(true);
  });

  it("marks only recorded prior transitions complete", () => {
    const steps = progressSteps("closed", ["submitted"]);
    expect(steps.map((step) => step.state)).toEqual(["completed", "later", "later", "terminal"]);
    expect(steps.at(-1)?.label).toContain("no verification result");
  });

  it("keeps partial cancellation history separate from the terminal outcome", () => {
    const steps = progressSteps("cancelled", ["submitted", "assigned"]);
    expect(steps.map((step) => step.state)).toEqual(["completed", "completed", "later", "cancelled"]);
  });

  it("does not invent a completed milestone when historical events are missing", () => {
    const steps = progressSteps("assigned", []);
    expect(steps.map((step) => step.state)).toEqual(["later", "current", "later"]);
  });
});
