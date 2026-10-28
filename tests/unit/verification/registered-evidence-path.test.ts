import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ maybeSingle: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: mocks.maybeSingle,
    })),
  }),
}));

import {
  EvidencePathLookupError,
  isEvidenceStoragePathRegistered,
} from "@/lib/case-evidence/registered-path";

const path = "documents/cases/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.pdf";

afterEach(() => {
  vi.clearAllMocks();
});

describe("global evidence storage-path lookup", () => {
  it("detects an existing path without returning evidence details", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: "existing" }, error: null });
    await expect(isEvidenceStoragePathRegistered(path)).resolves.toBe(true);
  });

  it("allows an unreferenced path to continue to stored-object verification", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(isEvidenceStoragePathRegistered(path)).resolves.toBe(false);
  });

  it("fails closed when the privileged lookup cannot establish global absence", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "sensitive database detail" } });
    await expect(isEvidenceStoragePathRegistered(path)).rejects.toBeInstanceOf(EvidencePathLookupError);
  });
});
