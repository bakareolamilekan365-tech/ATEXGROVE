import { describe, expect, it } from "vitest";
import { caseProgressModel } from "@/components/cases/CaseProgress";

describe("case progress", () => {
  it("uses the four labelled stages and highlights only the saved draft stage", () => {
    const model = caseProgressModel("draft");
    expect(model.stages.map((stage) => stage.label)).toEqual(["Saved", "Submitted", "Reviewer assigned", "In review"]);
    expect(model.stages.map((stage) => stage.state)).toEqual(["current", "later", "later", "later"]);
  });

  it("shows reviewer assignment as a distinct supported milestone", () => {
    expect(caseProgressModel("assigned", ["submitted"]).stages.map((stage) => stage.state)).toEqual(["done", "done", "current", "later"]);
    expect(caseProgressModel("in_review", ["submitted", "assigned"]).stages.map((stage) => stage.state)).toEqual(["done", "done", "done", "current"]);
  });

  it("shows waiting on the customer as an amber note on the review stage", () => {
    const model = caseProgressModel("needs_customer_info", ["submitted", "in_review"]);
    expect(model.stages.map((stage) => stage.state)).toEqual(["done", "done", "done", "attention"]);
    expect(model.note).toContain("Waiting on you");
  });

  it("retains recorded progress and explains a closed outcome separately", () => {
    const model = caseProgressModel("closed", ["submitted", "assigned", "in_review"]);
    expect(model.stages.map((stage) => stage.state)).toEqual(["done", "done", "done", "done"]);
    expect(model.outcome).toEqual({ tone: "closed", label: "Closed", description: "This request has been closed. The review ended without a final land assessment." });
  });

  it("does not complete unrecorded milestones when a case is cancelled", () => {
    const model = caseProgressModel("cancelled", ["submitted"]);
    expect(model.stages.map((stage) => stage.state)).toEqual(["done", "done", "later", "later"]);
    expect(model.outcome).toEqual({ tone: "cancelled", label: "Cancelled", description: "This request was cancelled." });
  });
});
