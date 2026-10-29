import { describe, expect, it } from "vitest";
import {
  readThemePreference,
  resolveTheme,
  THEME_INITIALIZER,
  THEME_STORAGE_KEY,
  writeThemePreference,
} from "@/lib/theme";

describe("theme preference", () => {
  it("resolves explicit and operating-system preferences", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("persists a valid preference and treats missing or invalid storage as light", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    expect(readThemePreference(storage)).toBe("light");
    writeThemePreference(storage, "dark");
    expect(values.get(THEME_STORAGE_KEY)).toBe("dark");
    expect(readThemePreference(storage)).toBe("dark");
    values.set(THEME_STORAGE_KEY, "unsupported");
    expect(readThemePreference(storage)).toBe("light");
  });

  it("initializes light before hydration unless a saved preference exists", () => {
    expect(THEME_INITIALIZER).toContain("localStorage.getItem");
    expect(THEME_INITIALIZER).toContain("prefers-color-scheme: dark");
    expect(THEME_INITIALIZER).toContain("dataset.theme");
    expect(THEME_INITIALIZER).toContain("style.colorScheme");
    expect(THEME_INITIALIZER).toContain('stored : "light"');
    expect(THEME_INITIALIZER).toContain('dataset.themePreference = "light"');
  });
});
