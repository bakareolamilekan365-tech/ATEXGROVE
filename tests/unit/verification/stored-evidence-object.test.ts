import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: () => ({ info: mocks.info }) },
  }),
}));

import {
  StoredEvidenceVerificationError,
  verifyStoredEvidenceObject,
} from "@/lib/case-evidence/stored-object";

const path = "documents/cases/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.pdf";
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
  mocks.info.mockResolvedValue({
    data: { bucketId: "documents", name: path, size: 8, contentType: "application/pdf" },
    error: null,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

describe("authoritative stored evidence verification", () => {
  it("accepts matching metadata and a bounded PDF prefix", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]),
      { status: 206, headers: { "content-range": "bytes 0-7/8" } },
    ));

    await expect(verifyStoredEvidenceObject({ storagePath: path, mimeType: "application/pdf", sizeBytes: 8 })).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/storage/v1/object/documents/documents/cases/"),
      expect.objectContaining({
        headers: expect.objectContaining({ Range: "bytes=0-7" }),
        cache: "no-store",
      }),
    );
  });

  it("rejects mismatched authoritative size or content type before downloading", async () => {
    global.fetch = vi.fn();
    mocks.info.mockResolvedValueOnce({
      data: { bucketId: "documents", name: path, size: 9, contentType: "application/pdf" },
      error: null,
    });
    await expect(verifyStoredEvidenceObject({ storagePath: path, mimeType: "application/pdf", sizeBytes: 8 })).rejects.toBeInstanceOf(StoredEvidenceVerificationError);
    mocks.info.mockResolvedValueOnce({
      data: { bucketId: "documents", name: path, size: 8, contentType: "image/png" },
      error: null,
    });
    await expect(verifyStoredEvidenceObject({ storagePath: path, mimeType: "application/pdf", sizeBytes: 8 })).rejects.toBeInstanceOf(StoredEvidenceVerificationError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fails closed instead of buffering the full object when Range is unsupported", async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue({ status: 200, body: { cancel } });
    await expect(verifyStoredEvidenceObject({ storagePath: path, mimeType: "application/pdf", sizeBytes: 8 })).rejects.toThrow("bounded prefix");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("rejects an invalid stored signature", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      { status: 206, headers: { "content-range": "bytes 0-7/8" } },
    ));
    await expect(verifyStoredEvidenceObject({ storagePath: path, mimeType: "application/pdf", sizeBytes: 8 })).rejects.toThrow("signature");
  });
});
