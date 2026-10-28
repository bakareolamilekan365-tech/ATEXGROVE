type EvidenceErrorLike = {
  code?: string;
  message?: string;
  statusCode?: string | number;
  error?: string;
};

export type EvidenceFailurePhase =
  | "input_validation"
  | "path_validation"
  | "case_lookup"
  | "case_state"
  | "duplicate_check"
  | "storage_upload"
  | "stored_object_verification"
  | "registration";

type EvidenceFailureContext = {
  caseId?: string;
  evidenceId?: string;
};

function asEvidenceError(error: unknown): EvidenceErrorLike {
  return error && typeof error === "object" ? error as EvidenceErrorLike : {};
}

function safeDiagnosticCode(value: unknown) {
  const text = String(value ?? "");
  return /^[A-Za-z0-9_]{1,32}$/.test(text) ? text : null;
}

/** Safe diagnostics; never logs account IDs, filenames, file bytes, paths, or raw errors. */
export function logEvidenceFailure(
  phase: EvidenceFailurePhase,
  reasonCode: string,
  error: unknown,
  context: EvidenceFailureContext = {},
) {
  const detail = asEvidenceError(error);
  console.error("Case evidence operation failed", {
    phase,
    reasonCode,
    caseId: context.caseId ?? null,
    evidenceId: context.evidenceId ?? null,
    code: safeDiagnosticCode(detail.code),
    statusCode: safeDiagnosticCode(detail.statusCode),
  });
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
