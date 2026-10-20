import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthorizedEvidenceDownload } from "@/lib/case-evidence/download";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildEvidenceStoragePath,
  extensionForMime,
  hasValidEvidenceFileSignature,
  MAX_EVIDENCE_FILE_SIZE,
  normalizeOriginalFilename,
  validateEvidenceFile,
} from "@/lib/case-evidence/validation";

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
