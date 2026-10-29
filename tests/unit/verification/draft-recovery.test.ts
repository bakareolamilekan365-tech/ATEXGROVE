import { describe, expect, it, vi } from "vitest";
import {
  DRAFT_RECOVERY_TTL_MS,
  clearDraftRecovery,
  createStoredCaseDraft,
  draftRecoveryKey,
  parseStoredCaseDraft,
} from "@/lib/verification-cases/draft-recovery";

const recoverable = {
  customerIntent: "developing",
  relationshipToLand: "owner",
  areaLga: "AMAC",
  areaName: "Gwarinpa",
  areaIsListed: true,
  siteDescription: "Synthetic plot near a known landmark",
};

describe("new-case draft recovery", () => {
  it("stores only the approved non-file fields for seven days", () => {
    const stored = createStoredCaseDraft(recoverable, 1_000);
    expect(stored.expiresAt).toBe(1_000 + DRAFT_RECOVERY_TTL_MS);
    expect(stored.values).toEqual(recoverable);
    expect(JSON.stringify(stored)).not.toMatch(/phone|principal|notes|file/i);
  });

  it("restores a valid interrupted draft and rejects expired or malformed data", () => {
    const raw = JSON.stringify(createStoredCaseDraft(recoverable, 1_000));
    expect(parseStoredCaseDraft(raw, 2_000)).toEqual(recoverable);
    expect(parseStoredCaseDraft(raw, 1_000 + DRAFT_RECOVERY_TTL_MS)).toBeNull();
    expect(parseStoredCaseDraft("not-json", 2_000)).toBeNull();
  });

  it("scopes and clears recovery data by authenticated user id", () => {
    const removeItem = vi.fn();
    expect(draftRecoveryKey("user-a")).not.toBe(draftRecoveryKey("user-b"));
    clearDraftRecovery({ removeItem }, "user-a");
    expect(removeItem).toHaveBeenCalledWith(draftRecoveryKey("user-a"));
  });

  it("never performs a server submission", () => {
    expect(JSON.stringify(createStoredCaseDraft(recoverable))).not.toMatch(/submitted|submit_verification_case/);
  });
});
