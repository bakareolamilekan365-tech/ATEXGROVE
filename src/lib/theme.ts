export const THEME_STORAGE_KEY = "atexgrove-theme";
export const themePreferences = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: string | null): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

export function readThemePreference(storage: Pick<Storage, "getItem">): ThemePreference {
  const stored = storage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

export function writeThemePreference(storage: Pick<Storage, "setItem">, preference: ThemePreference) {
  storage.setItem(THEME_STORAGE_KEY, preference);
}

export const THEME_INITIALIZER = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key);
    var preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {
    var fallbackDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.dataset.theme = fallbackDark ? "dark" : "light";
    document.documentElement.style.colorScheme = fallbackDark ? "dark" : "light";
  }
})();`;
