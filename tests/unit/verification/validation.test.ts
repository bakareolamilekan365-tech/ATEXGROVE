import { describe, expect, it } from "vitest";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";

const validRequest = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  siteDescription: "DEMO DATA / NOT OFFICIAL plot beside the Kuje market road",
  areaLga: "Kuje",
  notes: "Synthetic test request.",
  contactPreference: "email",
} as const;

describe("new verification case validation", () => {
  it("requires a UUID idempotency key", () => {
    expect(newVerificationCaseSchema.safeParse(validRequest).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({
      ...validRequest,
      idempotencyKey: "not-a-uuid",
    }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({
      ...validRequest,
      idempotencyKey: null,
    }).success).toBe(false);
  });
});
