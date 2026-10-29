export function initialsFromName(name: string | null | undefined, fallback: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return fallback.slice(0, 1).toLocaleUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 1).toLocaleUpperCase();
  return `${parts[0].slice(0, 1)}${parts.at(-1)?.slice(0, 1) ?? ""}`.toLocaleUpperCase();
}
