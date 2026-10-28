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

  it("persists a valid preference and treats invalid storage as system", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    expect(readThemePreference(storage)).toBe("system");
    writeThemePreference(storage, "dark");
    expect(values.get(THEME_STORAGE_KEY)).toBe("dark");
    expect(readThemePreference(storage)).toBe("dark");
    values.set(THEME_STORAGE_KEY, "unsupported");
    expect(readThemePreference(storage)).toBe("system");
  });

  it("initializes the theme before hydration from storage or the system preference", () => {
    expect(THEME_INITIALIZER).toContain("localStorage.getItem");
    expect(THEME_INITIALIZER).toContain("prefers-color-scheme: dark");
    expect(THEME_INITIALIZER).toContain("dataset.theme");
    expect(THEME_INITIALIZER).toContain("style.colorScheme");
  });
});
