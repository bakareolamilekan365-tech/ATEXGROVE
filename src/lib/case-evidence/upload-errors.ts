type EvidenceErrorLike = {
  code?: string;
  message?: string;
  statusCode?: string | number;
  error?: string;
};

export type EvidenceFailurePhase = "case_lookup" | "quota_check" | "storage_upload" | "stored_object_verification" | "registration" | "storage_cleanup";

function asEvidenceError(error: unknown): EvidenceErrorLike {
  return error && typeof error === "object" ? error as EvidenceErrorLike : {};
}

function sanitizeDiagnostic(value: string, privateValues: readonly string[] = []) {
  let safe = value;
  for (const privateValue of privateValues) {
    if (privateValue) safe = safe.split(privateValue).join("[redacted]");
  }
  return safe
    .replace(/documents\/cases\/[^\s"']+/gi, "[storage-path]")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "[id]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 240);
}

/** Safe, structured diagnostics; never logs account IDs, file bytes, or paths. */
export function logEvidenceFailure(
  phase: EvidenceFailurePhase,
  error: unknown,
  privateValues: readonly string[] = [],
) {
  const detail = asEvidenceError(error);
  console.error("Case evidence operation failed", {
    phase,
    code: detail.code ?? null,
    statusCode: detail.statusCode ?? null,
    message: sanitizeDiagnostic(detail.message ?? detail.error ?? "Unknown failure", privateValues),
  });
}

export async function cleanupAfterRegistrationFailure(
  error: unknown,
  storagePath: string,
  filenames: readonly string[],
  removeUploadedObject: () => Promise<{ error: unknown | null }>,
) {
  const privateValues = [...filenames, storagePath];
  logEvidenceFailure("registration", error, privateValues);
  try {
    const { error: cleanupError } = await removeUploadedObject();
    if (cleanupError) logEvidenceFailure("storage_cleanup", cleanupError, privateValues);
  } catch (cleanupError) {
    logEvidenceFailure("storage_cleanup", cleanupError, privateValues);
  }
  return evidenceRegistrationFailureMessage(error);
}

export async function cleanupAfterVerificationFailure(
  error: unknown,
  storagePath: string,
  filenames: readonly string[],
  removeUploadedObject: () => Promise<{ error: unknown | null }>,
) {
  const privateValues = [...filenames, storagePath];
  logEvidenceFailure("stored_object_verification", error, privateValues);
  try {
    const { error: cleanupError } = await removeUploadedObject();
    if (cleanupError) logEvidenceFailure("storage_cleanup", cleanupError, privateValues);
  } catch (cleanupError) {
    logEvidenceFailure("storage_cleanup", cleanupError, privateValues);
  }
  return "The uploaded file could not be verified. Check its type and try again.";
}

export function storageUploadFailureMessage(error: unknown) {
  const detail = asEvidenceError(error);
  const status = String(detail.statusCode ?? detail.code ?? "");
  if (status === "413" || /too large|payload.*large/i.test(detail.message ?? "")) {
    return "This file is over the 10 MB limit.";
  }
  if (status === "415" || /mime|content type|unsupported.*type/i.test(detail.message ?? "")) {
    return "This file type is not accepted. Choose a PDF, JPG or PNG.";
  }
  return "The file could not be uploaded. Check its type and size, then try again.";
}

export function evidenceRegistrationFailureMessage(error: unknown) {
  const detail = asEvidenceError(error);
  const message = detail.message ?? "";
  if (detail.code === "42501") {
    return "You can no longer add documents to this case. Refresh the page to check its status.";
  }
  if (detail.code === "23505" || /already has a replacement/i.test(message)) {
    return "That version already has a replacement. Refresh and choose the latest version.";
  }
  if (/Superseded evidence must belong to this case/i.test(message)) {
    return "Choose a document version from this case.";
  }
  if (/replacement must keep the same evidence type/i.test(message)) {
    return "A replacement must use the same document type as the version selected.";
  }
  if (/at most 10 files/i.test(message)) {
    return "This case already has the maximum of 10 files.";
  }
  if (/not accepting evidence/i.test(message)) {
    return "This case is no longer accepting documents.";
  }
  if (/Evidence object was not uploaded/i.test(message)) {
    return "The upload did not finish. Please choose the file and try again.";
  }
  if (/Unsupported file type/i.test(message)) {
    return "This file type is not accepted. Choose a PDF, JPG or PNG.";
  }
  if (/File must be no larger than 10 MB/i.test(message)) {
    return "This file is over the 10 MB limit.";
  }
  return "The document could not be registered. Please try again.";
}
