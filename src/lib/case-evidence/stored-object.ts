import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hasValidEvidenceFileSignature,
  MAX_EVIDENCE_FILE_SIZE,
} from "./validation";

type StoredEvidenceInput = {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export class StoredEvidenceVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoredEvidenceVerificationError";
  }
}

function privateObjectUrl(projectUrl: string, storagePath: string) {
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${projectUrl.replace(/\/$/, "")}/storage/v1/object/documents/${encodedPath}`;
}

/**
 * Verifies Storage's authoritative metadata and only the first eight object bytes.
 * A non-206 response fails closed so a hosting function never buffers the full file.
 */
export async function verifyStoredEvidenceObject(input: StoredEvidenceInput) {
  const admin = createSupabaseAdminClient();
  const { data: object, error: infoError } = await admin.storage
    .from("documents")
    .info(input.storagePath);

  if (infoError || !object) {
    throw new StoredEvidenceVerificationError("The uploaded object could not be found.");
  }
  if (object.bucketId !== "documents" || object.name !== input.storagePath) {
    throw new StoredEvidenceVerificationError("The uploaded object identity did not match.");
  }
  if (typeof object.size !== "number" || object.size !== input.sizeBytes) {
    throw new StoredEvidenceVerificationError("The uploaded object size did not match.");
  }
  if (object.size <= 0 || object.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new StoredEvidenceVerificationError("The uploaded object size is not permitted.");
  }
  if (object.contentType && object.contentType !== input.mimeType) {
    throw new StoredEvidenceVerificationError("The uploaded object type did not match.");
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  const response = await fetch(privateObjectUrl(projectUrl, input.storagePath), {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: "bytes=0-7",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (response.status !== 206) {
    await response.body?.cancel();
    throw new StoredEvidenceVerificationError("Private Storage did not return a bounded prefix.");
  }

  const contentRange = response.headers.get("content-range");
  const rangeMatch = /^bytes 0-(\d+)\/(\d+)$/.exec(contentRange ?? "");
  if (!rangeMatch || Number(rangeMatch[2]) !== object.size || Number(rangeMatch[1]) > 7) {
    await response.body?.cancel();
    throw new StoredEvidenceVerificationError("Private Storage returned an invalid prefix range.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 8 || !hasValidEvidenceFileSignature(input.mimeType, bytes)) {
    throw new StoredEvidenceVerificationError("The stored file signature did not match its type.");
  }
}
