import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  verifyStoredEvidenceObject: vi.fn(),
  remove: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser: mocks.requireAuthenticatedUser }));
vi.mock("@/lib/case-evidence/stored-object", () => ({
  verifyStoredEvidenceObject: mocks.verifyStoredEvidenceObject,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: () => ({ remove: mocks.remove }) },
  }),
}));

import { finalizeCaseEvidenceUploadAction } from "@/app/dashboard/cases/[id]/actions";

const caseId = "11111111-1111-4111-8111-111111111111";
const evidenceId = "22222222-2222-4222-8222-222222222222";
const otherEvidenceId = "33333333-3333-4333-8333-333333333333";
const path = `documents/cases/${caseId}/${evidenceId}/44444444-4444-4444-8444-444444444444.pdf`;
const validInput = {
  caseId,
  evidenceId,
  evidenceType: "survey_plan_copy" as const,
  description: "Synthetic survey plan",
  supersedesEvidenceId: "",
  storagePath: path,
  originalFilename: "synthetic-plan.pdf",
  mimeType: "application/pdf" as const,
  sizeBytes: 1024,
};

function authenticatedClient(options: {
  caseRow?: { id: string; workflow_status: string; discarded_at: string | null } | null;
  caseError?: unknown;
  count?: number;
  countError?: unknown;
  rpcError?: unknown;
} = {}) {
  const caseRow = options.caseRow === undefined
    ? { id: caseId, workflow_status: "draft", discarded_at: null }
    : options.caseRow;
  const maybeSingle = vi.fn().mockResolvedValue({ data: caseRow, error: options.caseError ?? null });
  const caseBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
  };
  const evidenceBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ count: options.count ?? 0, error: options.countError ?? null }),
  };
  const rpc = vi.fn().mockResolvedValue({ data: evidenceId, error: options.rpcError ?? null });
  const supabase = {
    from: vi.fn((table: string) => table === "verification_cases" ? caseBuilder : evidenceBuilder),
    rpc,
  };
  mocks.requireAuthenticatedUser.mockResolvedValue({ supabase, user: { id: "customer-a" } });
  return { supabase, rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyStoredEvidenceObject.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue({ data: [], error: null });
});

describe("metadata-only evidence finalization", () => {
  it("requires authentication", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(new Error("Authentication required"));
    await expect(finalizeCaseEvidenceUploadAction(validInput)).rejects.toThrow("Authentication required");
  });

  it("refuses a case that is not owned by the authenticated customer", async () => {
    authenticatedClient({ caseRow: null });
    await expect(finalizeCaseEvidenceUploadAction(validInput)).resolves.toMatchObject({ error: "This case was not found or is not yours." });
    expect(mocks.verifyStoredEvidenceObject).not.toHaveBeenCalled();
  });

  it("refuses ineligible and discarded cases", async () => {
    authenticatedClient({ caseRow: { id: caseId, workflow_status: "submitted", discarded_at: null } });
    await expect(finalizeCaseEvidenceUploadAction(validInput)).resolves.toMatchObject({ error: "This case is not accepting documents." });
    authenticatedClient({ caseRow: { id: caseId, workflow_status: "draft", discarded_at: "2026-10-27T00:00:00Z" } });
    await expect(finalizeCaseEvidenceUploadAction(validInput)).resolves.toMatchObject({ error: "This case is not accepting documents." });
  });

  it("rejects malformed, cross-case and mismatched-evidence paths", async () => {
    authenticatedClient();
    await expect(finalizeCaseEvidenceUploadAction({ ...validInput, storagePath: "documents/cases/nope" })).resolves.toMatchObject({ error: "The uploaded file path is invalid." });
    await expect(finalizeCaseEvidenceUploadAction({ ...validInput, storagePath: path.replace(caseId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") })).resolves.toMatchObject({ error: "The uploaded file path is invalid." });
    await expect(finalizeCaseEvidenceUploadAction({ ...validInput, storagePath: path.replace(evidenceId, otherEvidenceId) })).resolves.toMatchObject({ error: "The uploaded file path is invalid." });
  });

  it("rejects binary-bearing input instead of transporting it through the action", async () => {
    authenticatedClient();
    const result = await finalizeCaseEvidenceUploadAction({ ...validInput, file: new File(["%PDF-"], "x.pdf") } as never);
    expect(result.error).toBeTruthy();
    expect(mocks.verifyStoredEvidenceObject).not.toHaveBeenCalled();
  });

  it("does not register a missing or invalid stored object and attempts cleanup", async () => {
    const { rpc } = authenticatedClient();
    mocks.verifyStoredEvidenceObject.mockRejectedValue(new Error("signature mismatch"));
    const result = await finalizeCaseEvidenceUploadAction(validInput);
    expect(result.error).toContain("could not be verified");
    expect(rpc).not.toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith([path]);
  });

  it("verifies the stored object before calling the existing registration RPC", async () => {
    const { rpc } = authenticatedClient();
    await expect(finalizeCaseEvidenceUploadAction(validInput)).resolves.toMatchObject({
      error: null,
      success: expect.stringContaining("not yet submitted"),
    });
    expect(mocks.verifyStoredEvidenceObject).toHaveBeenCalledWith({
      storagePath: path,
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
    expect(rpc).toHaveBeenCalledWith("register_case_evidence", expect.objectContaining({
      p_evidence_id: evidenceId,
      p_case_id: caseId,
      p_storage_path: path,
    }));
    expect(mocks.verifyStoredEvidenceObject.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0]);
  });

  it("attempts cleanup when registration fails", async () => {
    authenticatedClient({ rpcError: { code: "23505", message: "already has a replacement" } });
    const result = await finalizeCaseEvidenceUploadAction(validInput);
    expect(result.error).toContain("latest version");
    expect(mocks.remove).toHaveBeenCalledWith([path]);
  });
});
