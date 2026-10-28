import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildEvidenceStoragePath,
  evidenceUploadSchema,
  normalizeOriginalFilename,
  validateEvidenceFile,
  validateEvidenceFileSignature,
  type EvidenceFinalizationInput,
} from "./validation";
import { storageUploadFailureMessage } from "./upload-errors";

export type DirectEvidenceUploadInput = {
  caseId: string;
  evidenceType: string;
  description: string;
  supersedesEvidenceId?: string;
  file: File;
};

export type EvidenceUploadResult = { error: string | null; success: string | null };

type FinalizeEvidenceUpload = (
  input: EvidenceFinalizationInput,
) => Promise<EvidenceUploadResult>;

export async function uploadEvidenceDirectly(
  supabase: SupabaseClient,
  input: DirectEvidenceUploadInput,
  finalize: FinalizeEvidenceUpload,
): Promise<EvidenceUploadResult> {
  const parsed = evidenceUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the evidence details.", success: null };
  }

  const fileValidation = validateEvidenceFile(input.file);
  if (!fileValidation.ok) return { error: fileValidation.error, success: null };
  if (!(await validateEvidenceFileSignature(input.file))) {
    return {
      error: "The file contents do not match its declared PDF, JPG or PNG type.",
      success: null,
    };
  }

  const evidenceId = crypto.randomUUID();
  const storagePath = buildEvidenceStoragePath(
    parsed.data.caseId,
    evidenceId,
    crypto.randomUUID(),
    input.file.type,
  );
  const originalFilename = normalizeOriginalFilename(input.file.name);

  let uploadError: unknown | null = null;
  try {
    const result = await supabase.storage.from("documents").upload(storagePath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
    uploadError = result.error;
  } catch (error) {
    uploadError = error;
  }
  if (uploadError) {
    return { error: storageUploadFailureMessage(uploadError), success: null };
  }

  return finalize({
    caseId: parsed.data.caseId,
    evidenceId,
    evidenceType: parsed.data.evidenceType,
    description: parsed.data.description,
    supersedesEvidenceId: parsed.data.supersedesEvidenceId ?? "",
    storagePath,
    originalFilename,
    mimeType: input.file.type as EvidenceFinalizationInput["mimeType"],
    sizeBytes: input.file.size,
  });
}
