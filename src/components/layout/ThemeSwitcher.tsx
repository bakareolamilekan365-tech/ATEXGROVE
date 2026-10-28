"use client";

import { useEffect, useState } from "react";
import {
  readThemePreference,
  resolveTheme,
  themePreferences,
  type ThemePreference,
  writeThemePreference,
} from "@/lib/theme";

const labels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function applyTheme(preference: ThemePreference, prefersDark: boolean) {
  const resolved = resolveTheme(preference, prefersDark);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const initial = readThemePreference(window.localStorage);
    setPreference(initial);
    applyTheme(initial, media.matches);

    function systemChanged(event: MediaQueryListEvent) {
      if (readThemePreference(window.localStorage) === "system") applyTheme("system", event.matches);
    }
    media.addEventListener("change", systemChanged);
    return () => media.removeEventListener("change", systemChanged);
  }, []);

  function changeTheme(next: ThemePreference) {
    writeThemePreference(window.localStorage, next);
    setPreference(next);
    applyTheme(next, window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  return (
    <label className="theme-switcher">
      <span>Theme</span>
      <select aria-label="Colour theme" value={preference} onChange={(event) => changeTheme(event.target.value as ThemePreference)}>
        {themePreferences.map((theme) => <option key={theme} value={theme}>{labels[theme]}</option>)}
      </select>
    </label>
  );
}
