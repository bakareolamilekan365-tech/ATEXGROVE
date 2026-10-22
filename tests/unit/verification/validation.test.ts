import { describe, expect, it } from "vitest";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";
import { fctAreaCouncils, fctLocationsDisclaimer } from "@/lib/verification-cases/abuja-locations";

const validRequest = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  siteDescription: "DEMO DATA / NOT OFFICIAL plot beside the Kuje market road",
  areaLga: "Kuje",
  areaName: "Kuje",
  areaIsListed: true,
  addressLine: "Near the Kuje market road",
  notes: "Synthetic test request.",
  contactPreference: "email",
  contactPhone: "",
  contactPhoneConsent: false,
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

  it("provides six named councils with starter areas and an explicit disclaimer", () => {
    expect(fctAreaCouncils.map(({ name }) => name)).toEqual(["AMAC", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Abaji"]);
    expect(fctAreaCouncils.every(({ areas }) => areas.length > 0)).toBe(true);
    expect(fctLocationsDisclaimer).toMatch(/not official/i);
  });

  it("validates listed locations and permits explicitly unlisted areas", () => {
    expect(newVerificationCaseSchema.safeParse(validRequest).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, areaName: "Imaginary" }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, areaName: "Imaginary", areaIsListed: false }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, areaLga: "Lagos" }).success).toBe(false);
  });

  it("requires consent and a plausible Nigerian number only for phone channels", () => {
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, contactPreference: "phone", contactPhone: "08012345678", contactPhoneConsent: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, contactPreference: "whatsapp", contactPhone: "+2348012345678", contactPhoneConsent: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, contactPreference: "phone", contactPhone: "08012345678", contactPhoneConsent: false }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, contactPreference: "email", contactPhone: "08012345678" }).success).toBe(false);
  });
});
