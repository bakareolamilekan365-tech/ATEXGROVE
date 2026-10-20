import { describe, expect, it } from "vitest";
import {
  assignmentSchema,
  newVerificationCaseSchema,
  statusTransitionSchema,
} from "@/lib/verification-cases/validation";

describe("verification case request contracts", () => {
  it("accepts a complete synthetic Abuja request", () => {
    expect(newVerificationCaseSchema.safeParse({
      siteDescription: "DEMO DATA / NOT OFFICIAL plot beside the Kuje market road",
      areaLga: "Kuje",
      notes: "Synthetic test request.",
      contactPreference: "email",
    }).success).toBe(true);
  });

  it("rejects incomplete requests and unsupported contact methods", () => {
    expect(newVerificationCaseSchema.safeParse({
      siteDescription: "Plot",
      areaLga: "",
      notes: "",
      contactPreference: "sms",
    }).success).toBe(false);
  });

  it("requires an actor note for assignment", () => {
    expect(assignmentSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      assigneeUserId: "22222222-2222-4222-8222-222222222222",
      note: "",
      customerVisible: false,
    }).success).toBe(false);
  });

  it("requires an actor note for every status move", () => {
    expect(statusTransitionSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      toStatus: "in_review",
      staffNote: "Started review.",
      customerMessage: "We have started reviewing your request.",
    }).success).toBe(true);
    expect(statusTransitionSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      toStatus: "in_review",
      staffNote: "",
      customerMessage: "",
    }).success).toBe(false);
  });
});
