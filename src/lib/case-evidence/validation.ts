import { z } from "zod";

export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_EVIDENCE_FILES_PER_CASE = 10;
export const evidenceMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export const evidenceTypes = [
  "title_deed_copy",
  "survey_plan_copy",
  "receipt",
  "seller_id",
  "other",
] as const;

export const evidenceTypeLabels: Record<(typeof evidenceTypes)[number], string> = {
  title_deed_copy: "Title deed copy",
  survey_plan_copy: "Survey plan copy",
  receipt: "Receipt",
  seller_id: "ID of seller",
  other: "Other",
};

export const evidenceUploadSchema = z.object({
  caseId: z.string().uuid(),
  evidenceType: z.enum(evidenceTypes),
  description: z.string().trim().min(2, "Add a short description.").max(500),
  supersedesEvidenceId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

export const customerResponseSchema = z.object({
  caseId: z.string().uuid(),
  message: z.string().trim().min(2, "Add a response message.").max(2000),
});

export type EvidenceFileInput = { name: string; type: string; size: number };

const extensionsByMime: Record<(typeof evidenceMimeTypes)[number], string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function validateEvidenceFile(file: EvidenceFileInput) {
  if (!evidenceMimeTypes.includes(file.type as (typeof evidenceMimeTypes)[number])) {
    return { ok: false as const, error: "Upload a PDF, JPG or PNG file." };
  }
  if (file.size <= 0 || file.size > MAX_EVIDENCE_FILE_SIZE) {
    return { ok: false as const, error: "The file must be between 1 byte and 10 MB." };
  }
  return { ok: true as const };
}

export function extensionForMime(mimeType: string) {
  return extensionsByMime[mimeType as keyof typeof extensionsByMime] ?? null;
}

export function normalizeOriginalFilename(filename: string) {
  const leaf = filename.split(/[\\/]/).pop() ?? "document";
  const withoutControls = Array.from(leaf.normalize("NFKC"))
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 32 && codePoint !== 127;
    })
    .join("");
  const normalized = withoutControls
    .replace(/[^\p{L}\p{N}._() -]/gu, "_")
    .trim();
  return (normalized || "document").slice(0, 255);
}

export function buildEvidenceStoragePath(
  caseId: string,
  evidenceId: string,
  randomId: string,
  mimeType: string,
) {
  const extension = extensionForMime(mimeType);
  if (!extension) throw new Error("Unsupported evidence MIME type.");
  return `documents/cases/${caseId}/${evidenceId}/${randomId}.${extension}`;
}
