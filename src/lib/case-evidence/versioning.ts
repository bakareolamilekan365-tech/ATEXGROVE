import type { CaseEvidence } from "@/types/verification";
import type { evidenceTypes } from "./validation";

export type ReplaceableEvidence = Pick<
  CaseEvidence,
  "id" | "evidence_type" | "version" | "original_filename" | "supersedes_evidence_id"
>;

/** Only a chain's current leaf can be selected as the predecessor. */
export function latestReplaceableEvidence<T extends ReplaceableEvidence>(
  evidence: readonly T[],
  type: (typeof evidenceTypes)[number],
) {
  const replacedIds = new Set(
    evidence
      .map((item) => item.supersedes_evidence_id)
      .filter((id): id is string => id !== null),
  );
  return evidence.filter(
    (item) => item.evidence_type === type && !replacedIds.has(item.id),
  );
}
