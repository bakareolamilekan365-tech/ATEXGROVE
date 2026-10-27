import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthorizedEvidenceDownload } from "@/lib/case-evidence/download";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildEvidenceStoragePath,
  evidenceStoragePathMatches,
  extensionForMime,
  hasValidEvidenceFileSignature,
  MAX_EVIDENCE_FILE_SIZE,
  normalizeOriginalFilename,
  parseEvidenceStoragePath,
  validateEvidenceFile,
} from "@/lib/case-evidence/validation";
import { latestReplaceableEvidence } from "@/lib/case-evidence/versioning";
import { cleanupAfterRegistrationFailure, evidenceRegistrationFailureMessage, storageUploadFailureMessage } from "@/lib/case-evidence/upload-errors";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("case evidence validation", () => {
  it("accepts the allowed file types up to 10 MB", () => {
    expect(validateEvidenceFile({ name: "plan.pdf", type: "application/pdf", size: MAX_EVIDENCE_FILE_SIZE })).toEqual({ ok: true });
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/png")).toBe("png");
  });

  it("rejects oversized, empty and unsupported files", () => {
    expect(validateEvidenceFile({ name: "large.pdf", type: "application/pdf", size: MAX_EVIDENCE_FILE_SIZE + 1 }).ok).toBe(false);
    expect(validateEvidenceFile({ name: "empty.png", type: "image/png", size: 0 }).ok).toBe(false);
    expect(validateEvidenceFile({ name: "page.html", type: "text/html", size: 20 }).ok).toBe(false);
  });

  it("accepts only file signatures that match the declared MIME type", () => {
    expect(hasValidEvidenceFileSignature("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe(true);
    expect(hasValidEvidenceFileSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(hasValidEvidenceFileSignature("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe(true);
    expect(hasValidEvidenceFileSignature("application/pdf", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(hasValidEvidenceFileSignature("image/jpeg", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(false);
    expect(hasValidEvidenceFileSignature("image/png", new Uint8Array([0xff, 0xd8, 0xff]))).toBe(false);
  });

  it("normalizes the original name and never includes it in the object path", () => {
    expect(normalizeOriginalFilename("../seller<script>.pdf")).toBe("seller_script_.pdf");
    const path = buildEvidenceStoragePath(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
      "application/pdf",
    );
    expect(path).toBe("documents/cases/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.pdf");
    expect(path).not.toContain("seller");
    expect(parseEvidenceStoragePath(path)).toMatchObject({
      caseId: "11111111-1111-4111-8111-111111111111",
      evidenceId: "22222222-2222-4222-8222-222222222222",
      extension: "pdf",
    });
    expect(evidenceStoragePathMatches(
      path,
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "application/pdf",
    )).toBe(true);
    expect(evidenceStoragePathMatches(
      path,
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "22222222-2222-4222-8222-222222222222",
      "application/pdf",
    )).toBe(false);
    expect(evidenceStoragePathMatches(
      path,
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "image/png",
    )).toBe(false);
    expect(parseEvidenceStoragePath("documents/cases/not-a-uuid/file.pdf")).toBeNull();
  });
});

describe("evidence replacement choices and safe errors", () => {
  const history = [
    { id: "v1", evidence_type: "title_deed_copy" as const, version: 1, original_filename: "deed-v1.pdf", supersedes_evidence_id: null },
    { id: "v2", evidence_type: "title_deed_copy" as const, version: 2, original_filename: "deed-v2.pdf", supersedes_evidence_id: "v1" },
    { id: "plan1", evidence_type: "survey_plan_copy" as const, version: 1, original_filename: "plan.pdf", supersedes_evidence_id: null },
  ];

  it("offers only the current leaf for the selected document type", () => {
    expect(latestReplaceableEvidence(history, "title_deed_copy").map((item) => item.id)).toEqual(["v2"]);
    expect(latestReplaceableEvidence(history, "survey_plan_copy").map((item) => item.id)).toEqual(["plan1"]);
    expect(latestReplaceableEvidence(history, "receipt")).toEqual([]);
  });

  it("maps known storage and registration categories to safe customer messages", () => {
    expect(storageUploadFailureMessage({ statusCode: "413", message: "payload too large" })).toContain("10 MB");
    expect(storageUploadFailureMessage({ statusCode: "415" })).toContain("PDF, JPG or PNG");
    expect(evidenceRegistrationFailureMessage({ code: "23505" })).toContain("latest version");
    expect(evidenceRegistrationFailureMessage({ code: "42501" })).toContain("case");
    expect(evidenceRegistrationFailureMessage({ code: "XX000", message: "secret database detail" })).toBe("The document could not be registered. Please try again.");
  });

  it("attempts cleanup after failed registration and sanitizes server diagnostics", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const message = await cleanupAfterRegistrationFailure(
      { code: "23505", message: "duplicate for documents/cases/11111111-1111-4111-8111-111111111111/file.pdf" },
      "documents/cases/11111111-1111-4111-8111-111111111111/file.pdf",
      ["private-name.pdf"],
      remove,
    );
    expect(remove).toHaveBeenCalledOnce();
    expect(message).toContain("latest version");
    expect(log).toHaveBeenCalledOnce();
    const diagnostic = JSON.stringify(log.mock.calls);
    expect(diagnostic).not.toContain("private-name.pdf");
    expect(diagnostic).not.toContain("11111111-1111-4111-8111-111111111111");
    log.mockRestore();
  });
});

describe("staff evidence download authorization", () => {
  it("refuses before signing when database access is denied", async () => {
    const createSignedUrl = vi.fn();
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "denied" } }),
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as never);

    await expect(createAuthorizedEvidenceDownload(client as never, crypto.randomUUID())).rejects.toThrow("Staff access");
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("creates a 60-second attachment URL after authorization", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.invalid/signed" }, error: null });
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: [{ storage_path: "documents/cases/c/e/f.pdf", original_filename: "evidence.pdf" }], error: null }),
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as never);

    await expect(createAuthorizedEvidenceDownload(client as never, crypto.randomUUID())).resolves.toBe("https://example.invalid/signed");
    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(createSignedUrl).toHaveBeenCalledWith("documents/cases/c/e/f.pdf", 60, { download: "evidence.pdf" });
  });
});
