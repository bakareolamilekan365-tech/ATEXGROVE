const PLACEHOLDER_ORIGIN = "http://redirect-check.invalid";
const MAX_DECODE_PASSES = 4;

function hasControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}

function hasUnsafeDecodedForm(value: string) {
  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return true;
  }
  if (decodedValue.includes("\\") || hasControlCharacter(decodedValue)) return true;

  let decoded = value.split(/[?#]/, 1)[0];

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    if (decoded.includes("\\") || hasControlCharacter(decoded)) return true;
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return true;

    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return true;
    }
    if (next === decoded) return false;
    decoded = next;
  }

  // Deeply nested encodings are ambiguous and unnecessary for app routes.
  return decoded.includes("%");
}

/**
 * Allow only same-app relative destinations; never reflect arbitrary URLs.
 * Rejects backslashes and control characters (browsers treat "/\host" and "/<tab>/host"
 * like "//host"), then parses the value and confirms the origin did not change.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (hasUnsafeDecodedForm(value)) {
    return fallback;
  }
  try {
    const parsed = new URL(value, PLACEHOLDER_ORIGIN);
    if (parsed.origin !== PLACEHOLDER_ORIGIN) {
      return fallback;
    }
    const normalizedPath = parsed.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    if (
      normalizedPath === "/login" ||
      normalizedPath.startsWith("/login/") ||
      normalizedPath === "/logout" ||
      normalizedPath.startsWith("/logout/")
    ) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function navigateAfterAuth(
  requestedPath: string | null | undefined,
  navigate: (destination: string) => void,
) {
  const destination = safeInternalPath(requestedPath);
  navigate(destination);
  return destination;
}
