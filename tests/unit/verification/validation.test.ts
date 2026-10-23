import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";
import { fctAreaCouncils, fctLocationsDisclaimer, STARTER_AREAS_VERSION } from "@/lib/verification-cases/abuja-locations";

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
  customerIntent: "buying",
  relationshipToLand: "buyer",
  actingFor: "self",
  principalName: "",
  authorityConfirmed: false,
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

  it("keeps the SQL starter-area allowlist identical to the typed location dataset", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/022_assignment_events_location_and_contact.sql"),
      "utf8",
    );
    expect(migration).toContain(`STARTER_AREAS_VERSION: ${STARTER_AREAS_VERSION}`);
    const sqlAreas = [...migration.matchAll(/\(normalized_area_lga = '([^']+)' and btrim\(p_area_name\) in \(([^)]*)\)\)/g)]
      .map(([, council, areaList]) => [
        council,
        [...areaList.matchAll(/'([^']+)'/g)].map(([, area]) => area),
      ]);
    const typedAreas = fctAreaCouncils.map(({ name, areas }) => [name, [...areas]]);

    expect(sqlAreas).toEqual(typedAreas);
    const normalizationAt = migration.indexOf("where area_lga = 'Kwali LGA'");
    const preflightAt = migration.indexOf("do $area_lga_preflight$");
    const constraintAt = migration.indexOf("add constraint verification_cases_area_lga_fct_council_check");
    expect(normalizationAt).toBeLessThan(preflightAt);
    expect(preflightAt).toBeLessThan(constraintAt);
    expect(migration).toContain("Normalize them by a reviewed migration or manual fix before retrying.");
    expect(migration).toContain("case when area_lga is null then '<NULL>' else quote_literal(area_lga) end");
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

  it("requires a principal and authority confirmation only when acting for another party", () => {
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "another_person", principalName: "Synthetic Principal", authorityConfirmed: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "another_person", principalName: "", authorityConfirmed: true }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "organisation", principalName: "Demo Company", authorityConfirmed: false }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "self", principalName: "Unexpected", authorityConfirmed: false }).success).toBe(false);
  });

  it("keeps the 024 case-number backfill ordered and limited to submitted cases", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/024_case_intake_and_consent.sql"), "utf8");
    expect(migration).toContain("row_number() over (order by created_at, id)");
    expect(migration).toContain("where workflow_status in ('submitted', 'assigned', 'in_review', 'needs_customer_info', 'closed', 'cancelled')");
    expect(migration).toContain("and discarded_at is null");
    expect(migration).toContain("create sequence public.verification_case_number_seq");
    expect(migration).toContain("revoke all on sequence public.verification_case_number_seq from public, anon, authenticated, service_role");
  });
});
