export const DRAFT_RECOVERY_PREFIX = "atexgrove:new-case-draft:";
export const DRAFT_RECOVERY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type RecoverableCaseDraft = {
  customerIntent: string;
  relationshipToLand: string;
  areaLga: string;
  areaName: string;
  areaIsListed: boolean;
  siteDescription: string;
};

type StoredCaseDraft = {
  version: 1;
  expiresAt: number;
  values: RecoverableCaseDraft;
};

export function draftRecoveryKey(userId: string) {
  return `${DRAFT_RECOVERY_PREFIX}${userId}`;
}

export function createStoredCaseDraft(
  values: RecoverableCaseDraft,
  now = Date.now(),
): StoredCaseDraft {
  return {
    version: 1,
    expiresAt: now + DRAFT_RECOVERY_TTL_MS,
    values,
  };
}

export function parseStoredCaseDraft(
  raw: string | null,
  now = Date.now(),
): RecoverableCaseDraft | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<StoredCaseDraft>;
    if (stored.version !== 1 || typeof stored.expiresAt !== "number" || stored.expiresAt <= now) {
      return null;
    }
    const values = stored.values;
    if (!values || typeof values !== "object") return null;
    if (
      typeof values.customerIntent !== "string" ||
      typeof values.relationshipToLand !== "string" ||
      typeof values.areaLga !== "string" ||
      typeof values.areaName !== "string" ||
      typeof values.areaIsListed !== "boolean" ||
      typeof values.siteDescription !== "string"
    ) {
      return null;
    }
    return values;
  } catch {
    return null;
  }
}

export function hasRecoverableCaseDraft(values: RecoverableCaseDraft) {
  return Boolean(
    values.customerIntent ||
    values.relationshipToLand ||
    values.areaLga ||
    values.areaName ||
    values.siteDescription,
  );
}

export function clearDraftRecovery(storage: Pick<Storage, "removeItem">, userId: string) {
  storage.removeItem(draftRecoveryKey(userId));
}
