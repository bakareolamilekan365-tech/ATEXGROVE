import { describe, expect, it } from "vitest";
import { caseProgressModel } from "@/components/cases/CaseProgress";

describe("case progress", () => {
  it("uses the four labelled stages and highlights only the saved draft stage", () => {
    const model = caseProgressModel("draft");
    expect(model.kind).toBe("stages");
    if (model.kind !== "stages") return;
    expect(model.stages.map((stage) => stage.label)).toEqual(["Saved", "Submitted", "In review", "Finished"]);
    expect(model.stages.map((stage) => stage.state)).toEqual(["current", "later", "later", "later"]);
  });

  it("marks only a recorded submitted milestone before the current review stage", () => {
    const recorded = caseProgressModel("in_review", ["submitted"]);
    const missing = caseProgressModel("in_review", []);
    if (recorded.kind !== "stages" || missing.kind !== "stages") return;
    expect(recorded.stages.map((stage) => stage.state)).toEqual(["done", "done", "current", "later"]);
    expect(missing.stages.map((stage) => stage.state)).toEqual(["done", "later", "current", "later"]);
  });

  it("shows waiting on the customer as an amber note on the review stage", () => {
    const model = caseProgressModel("needs_customer_info", ["submitted", "in_review"]);
    if (model.kind !== "stages") return;
    expect(model.stages.map((stage) => stage.state)).toEqual(["done", "done", "attention", "later"]);
    expect(model.note).toContain("Waiting on you");
  });

  it("replaces progress with a neutral closed outcome", () => {
    expect(caseProgressModel("closed", ["submitted", "in_review"])).toEqual({
      kind: "terminal",
      tone: "closed",
      label: "Closed",
      description: "This request has been closed. The review ended without a final land assessment.",
    });
  });

  it("replaces progress with a cancelled outcome instead of completed stages", () => {
    expect(caseProgressModel("cancelled", ["submitted", "in_review"])).toEqual({
      kind: "terminal",
      tone: "cancelled",
      label: "Cancelled",
      description: "This request was cancelled.",
    });
  });
});
