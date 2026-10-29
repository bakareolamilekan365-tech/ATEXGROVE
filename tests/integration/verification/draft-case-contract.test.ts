import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/023_draft_case_with_uploads.sql", "utf8");
const caseActions = readFileSync("src/app/dashboard/cases/[id]/actions.ts", "utf8");
const caseControls = readFileSync("src/components/cases/CustomerCaseControls.tsx", "utf8");
const createAction = readFileSync("src/app/dashboard/cases/actions.ts", "utf8");
const intakeMigration = readFileSync("supabase/migrations/024_case_intake_and_consent.sql", "utf8");

describe("draft case application/database contract", () => {
  it("starts idempotent requests as drafts and keeps creation event-free", () => {
    expect(migration).toContain("p_idempotency_key, 'draft'");
    expect(migration).toContain("'verification_case.draft_created'");
    expect(migration).not.toContain("'Request submitted by customer.'\n  );");
    expect(createAction).toContain("redirect(`/dashboard/cases/${caseId}?draft=created`)");
  });

  it("wires owner lifecycle server actions to the corresponding RPCs", () => {
    expect(caseActions).toContain('rpc("submit_verification_case"');
    expect(caseActions).toContain('rpc("discard_draft_case"');
    expect(caseActions).toContain('rpc("cancel_verification_case"');
    expect(caseActions).toContain("p_reason: reason");
    expect(caseActions).toContain('redirect("/dashboard/cases")');
  });

  it("keeps discarded drafts out of customer navigation and direct detail access", () => {
    const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
    const detail = readFileSync("src/app/dashboard/cases/[id]/page.tsx", "utf8");
    expect(dashboard).toContain('.is("discarded_at", null)');
    expect(detail).toContain('if (item.discarded_at) redirect("/dashboard/cases")');
  });

  it("replaces RPC signatures and writes explicit scope consent on submit", () => {
    expect(intakeMigration).toContain("drop function public.create_verification_case(");
    expect(intakeMigration).toContain("drop function public.submit_verification_case(uuid)");
    expect(intakeMigration).toContain("insert into public.case_consents");
    expect(caseActions).toContain("p_notice_version:");
    expect(caseActions).toContain("p_accepted: accepted");
  });

  it("presents draft submit/discard and open-case cancel controls", () => {
    expect(caseControls).toContain("Submit request");
    expect(caseControls).toContain("Discard draft");
    expect(caseControls).toContain("Cancel request");
    expect(caseControls).toContain("window.confirm");
  });
});
