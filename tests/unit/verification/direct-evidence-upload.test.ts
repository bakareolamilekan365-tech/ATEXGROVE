import { describe, expect, it, vi } from "vitest";
import { uploadEvidenceDirectly } from "@/lib/case-evidence/direct-upload";

const caseId = "11111111-1111-4111-8111-111111111111";

function pdfFile(size = 8) {
  const bytes = new Uint8Array(Math.max(size, 5));
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  return new File([bytes], "synthetic plan.pdf", { type: "application/pdf" });
}

function storageClient(upload: ReturnType<typeof vi.fn>) {
  return {
    storage: { from: vi.fn(() => ({ upload })) },
  } as never;
}

const input = () => ({
  caseId,
  evidenceType: "survey_plan_copy",
  description: "Synthetic survey plan",
  supersedesEvidenceId: "",
  file: pdfFile(),
});

describe("direct evidence upload", () => {
  it("uploads the binary directly with a unique immutable path, then finalizes metadata only", async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: "stored" }, error: null });
    const finalize = vi.fn().mockResolvedValue({ error: null, success: "Saved" });

    await expect(uploadEvidenceDirectly(storageClient(upload), input(), finalize)).resolves.toEqual({
      error: null,
      success: "Saved",
    });

    expect(upload).toHaveBeenCalledOnce();
    const [path, file, options] = upload.mock.calls[0];
    expect(path).toMatch(new RegExp(`^documents/cases/${caseId}/[0-9a-f-]+/[0-9a-f-]+\\.pdf$`));
    expect(file).toBeInstanceOf(File);
    expect(options).toEqual({ contentType: "application/pdf", upsert: false });
    expect(finalize).toHaveBeenCalledWith(expect.objectContaining({
      caseId,
      storagePath: path,
      originalFilename: "synthetic plan.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
    }));
    expect(finalize.mock.calls[0][0]).not.toHaveProperty("file");
  });

  it("does not finalize when the browser-to-Storage upload fails", async () => {
    const upload = vi.fn().mockResolvedValue({ data: null, error: { statusCode: 413 } });
    const finalize = vi.fn();
    const result = await uploadEvidenceDirectly(storageClient(upload), input(), finalize);
    expect(result.error).toContain("10 MB");
    expect(finalize).not.toHaveBeenCalled();
  });

  it("returns finalization failures without reporting success", async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: "stored" }, error: null });
    const finalize = vi.fn().mockResolvedValue({ error: "Stored signature rejected", success: null });
    await expect(uploadEvidenceDirectly(storageClient(upload), input(), finalize)).resolves.toEqual({
      error: "Stored signature rejected",
      success: null,
    });
  });

  it("rejects a mismatched signature before any network upload", async () => {
    const upload = vi.fn();
    const finalize = vi.fn();
    const bad = input();
    bad.file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "fake.pdf", { type: "application/pdf" });
    const result = await uploadEvidenceDirectly(storageClient(upload), bad, finalize);
    expect(result.error).toContain("contents do not match");
    expect(upload).not.toHaveBeenCalled();
    expect(finalize).not.toHaveBeenCalled();
  });
});
