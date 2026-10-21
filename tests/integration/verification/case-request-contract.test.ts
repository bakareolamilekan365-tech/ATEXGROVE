import { describe, expect, it } from "vitest";
import {
  assignmentSchema,
  newVerificationCaseSchema,
  statusTransitionSchema,
} from "@/lib/verification-cases/validation";

describe("verification case request contracts", () => {
  const idempotencyKey = "11111111-1111-4111-8111-111111111111";

  it("accepts a complete synthetic Abuja request", () => {
    expect(newVerificationCaseSchema.safeParse({
      idempotencyKey,
      siteDescription: "DEMO DATA / NOT OFFICIAL plot beside the Kuje market road",
      areaLga: "Kuje",
      notes: "Synthetic test request.",
      contactPreference: "email",
    }).success).toBe(true);
  });

  it("rejects incomplete requests and unsupported contact methods", () => {
    expect(newVerificationCaseSchema.safeParse({
      idempotencyKey,
      siteDescription: "Plot",
      areaLga: "",
      notes: "",
      contactPreference: "sms",
    }).success).toBe(false);
  });

  it("preserves the same idempotency key when a case request is replayed", () => {
    const request = {
      idempotencyKey,
      siteDescription: "DEMO DATA / NOT OFFICIAL replay-safe Kuje plot",
      areaLga: "Kuje",
      notes: "Synthetic retry contract.",
      contactPreference: "email" as const,
    };
    const firstAttempt = newVerificationCaseSchema.parse(request);
    const replayedAttempt = newVerificationCaseSchema.parse(request);

    expect(replayedAttempt.idempotencyKey).toBe(firstAttempt.idempotencyKey);
    expect(replayedAttempt).toEqual(firstAttempt);
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
