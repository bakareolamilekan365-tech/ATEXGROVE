import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";
import { mapCaseFormIssues } from "@/lib/verification-cases/form-errors";
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

  it("requires principal and authority for representation and rejects representing someone for self", () => {
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "another_person", principalName: "Synthetic Principal", authorityConfirmed: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "another_person", principalName: "", authorityConfirmed: true }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "organisation", principalName: "Demo Company", authorityConfirmed: false }).success).toBe(false);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, actingFor: "self", principalName: "Unexpected", authorityConfirmed: false }).success).toBe(false);
    const contradiction = newVerificationCaseSchema.safeParse({ ...validRequest, customerIntent: "representing_someone", actingFor: "self" });
    expect(contradiction.success).toBe(false);
    if (!contradiction.success) {
      expect(contradiction.error.issues.some((issue) => issue.path[0] === "actingFor" && /representing someone/i.test(issue.message))).toBe(true);
      expect(mapCaseFormIssues(contradiction.error.issues).fieldErrors.actingFor).toMatch(/representing someone.*another person or an organisation/i);
    }
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, customerIntent: "representing_someone", actingFor: "another_person", principalName: "Synthetic Principal", authorityConfirmed: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, customerIntent: "representing_someone", actingFor: "organisation", principalName: "Demo Company", authorityConfirmed: true }).success).toBe(true);
    expect(newVerificationCaseSchema.safeParse({ ...validRequest, customerIntent: "developing", actingFor: "self" }).success).toBe(true);
  });

  it("uses an RLS-protected private annual counter and deterministic per-year backfill", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/024_case_intake_and_consent.sql"), "utf8");
    expect(migration).toContain("row_number() over (partition by extract(year from timezone('Africa/Lagos', created_at))::integer order by created_at, id)");
    expect(migration).toContain("where workflow_status in ('submitted', 'assigned', 'in_review', 'needs_customer_info', 'closed', 'cancelled')");
    expect(migration).toContain("and discarded_at is null");
    expect(migration).toContain("group by extract(year from timezone('Africa/Lagos', created_at))::integer");
    expect(migration).toContain("create table public.verification_case_number_counters");
    expect(migration).toContain("alter table public.verification_case_number_counters enable row level security");
    expect(migration).toContain("revoke all on public.verification_case_number_counters from public, anon, authenticated, service_role");
    expect(migration).toContain("on conflict (year) do update");
    expect(migration).toContain("timezone('Africa/Lagos', transaction_timestamp())");
    expect(migration).not.toContain("verification_case_number_seq");
  });

  it("renders draft receipt language as saved, not received", () => {
    const dashboard = readFileSync(resolve(process.cwd(), "src/app/dashboard/page.tsx"), "utf8");
    const casePage = readFileSync(resolve(process.cwd(), "src/app/dashboard/cases/[id]/page.tsx"), "utf8");
    expect(dashboard).toContain('item.workflow_status === "draft" ? "Saved" : "Received"');
    expect(casePage).toContain('item.workflow_status === "draft" ? "Draft" : "Request received"');
  });

  it("describes the create action failure as saving a draft", () => {
    const action = readFileSync(resolve(process.cwd(), "src/app/dashboard/cases/actions.ts"), "utf8");
    expect(action).toContain("We could not save this draft.");
    expect(action).not.toContain("We could not submit this request.");
  });
});
