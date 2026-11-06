export function privatePreviewEnabled(
  value = process.env.NEXT_PUBLIC_PRIVATE_PREVIEW,
) {
  return value === "true";
}

export function publicRegistrationEnabled(
  value = process.env.NEXT_PUBLIC_PRIVATE_PREVIEW,
) {
  return !privatePreviewEnabled(value);
}
