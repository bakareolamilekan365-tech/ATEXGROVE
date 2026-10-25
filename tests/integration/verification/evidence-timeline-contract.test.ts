import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20261023144032_case_timeline_evidence_workflow.sql", "utf8");
const uploadForm = readFileSync("src/components/cases/EvidenceUploadForm.tsx", "utf8");
const customerPage = readFileSync("src/app/dashboard/cases/[id]/page.tsx", "utf8");
const staffPage = readFileSync("src/app/ops/cases/[id]/page.tsx", "utf8");
const evidenceActions = readFileSync("src/app/dashboard/cases/[id]/actions.ts", "utf8");

describe("case timeline and evidence versioning contract", () => {
  it("records uploads as activity and keeps draft uploads out of staff scope until submission", () => {
    expect(migration).toContain("'document_uploaded'");
    expect(migration).toContain("event_reason, true, 'document_uploaded'");
    expect(customerPage).toContain("timelineEventHeading(event)");
    expect(staffPage).toContain("timelineEventHeading(event)");
  });

  it("requires a replacement to extend the current chain head and preserves predecessor links", () => {
    expect(migration).toContain("case_evidence_single_successor_idx");
    expect(migration).toContain("This version already has a replacement; select the latest version");
    expect(migration).toContain("Superseded evidence must belong to this case");
    expect(migration).toContain("next_version := predecessor.version + 1");
    expect(uploadForm).toContain("New document");
    expect(uploadForm).toContain("Replacement version");
    expect(uploadForm).toContain("latestReplaceableEvidence");
  });

  it("keeps the uploaded object cleanup attempt and does not expose database errors", () => {
    expect(evidenceActions).toContain("cleanupAfterRegistrationFailure(");
    expect(evidenceActions).toContain("storageUploadFailureMessage");
    expect(evidenceActions).not.toContain("registrationError.message");
  });

  it("writes the safe status transition and actual customer response as distinct ordered events", () => {
    expect(migration).toContain("'Your case is now in review.', true, 'status_change', clock_timestamp()");
    expect(migration).toContain("btrim(p_message), true, 'customer_response', clock_timestamp()");
    expect(migration).toContain("'verification_case.customer_responded'");
  });
});
