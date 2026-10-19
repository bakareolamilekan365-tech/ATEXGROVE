import { describe, expect, it, vi } from "vitest";
import { createAuthorizedEvidenceDownload } from "@/lib/case-evidence/download";
import {
  buildEvidenceStoragePath,
  extensionForMime,
  MAX_EVIDENCE_FILE_SIZE,
  normalizeOriginalFilename,
  validateEvidenceFile,
} from "@/lib/case-evidence/validation";

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
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    };

    await expect(createAuthorizedEvidenceDownload(client as never, crypto.randomUUID())).rejects.toThrow("Staff access");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("creates a 60-second attachment URL after authorization", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.invalid/signed" }, error: null });
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: [{ storage_path: "documents/cases/c/e/f.pdf", original_filename: "evidence.pdf" }], error: null }),
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    };

    await expect(createAuthorizedEvidenceDownload(client as never, crypto.randomUUID())).resolves.toBe("https://example.invalid/signed");
    expect(createSignedUrl).toHaveBeenCalledWith("documents/cases/c/e/f.pdf", 60, { download: "evidence.pdf" });
  });
});
