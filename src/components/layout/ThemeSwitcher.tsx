"use client";

import { useEffect, useState } from "react";
import { readThemePreference, resolveTheme, themePreferences, type ThemePreference, writeThemePreference } from "@/lib/theme";

const labels: Record<ThemePreference, string> = { light: "Light", dark: "Dark", system: "System" };
const changeEvent = "atexgrove-theme-changed";

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function useAppearance() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const next = readThemePreference(window.localStorage);
      setPreference(next);
      applyTheme(next);
      setResolved(resolveTheme(next, media.matches));
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener(changeEvent, sync);
    return () => { media.removeEventListener("change", sync); window.removeEventListener("storage", sync); window.removeEventListener(changeEvent, sync); };
  }, []);
  function setTheme(next: ThemePreference) {
    writeThemePreference(window.localStorage, next);
    applyTheme(next);
    window.dispatchEvent(new Event(changeEvent));
  }
  return { preference, resolved, setTheme };
}

export function ThemeSwitcher() {
  const { resolved, setTheme } = useAppearance();
  const next = resolved === "dark" ? "light" : "dark";
  return <button className="theme-toggle" type="button" title={`Switch to ${next} appearance`} aria-label={`Switch to ${next} appearance`} onClick={() => setTheme(next)}>
    {resolved === "dark" ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>}
  </button>;
}

export function AppearanceSettings() {
  const { preference, setTheme } = useAppearance();
  return <fieldset className="appearance-choices"><legend className="sr-only">Appearance preference</legend>{themePreferences.map((option) => <label key={option} className={preference === option ? "appearance-choice appearance-choice--selected" : "appearance-choice"}><input type="radio" name="appearance" value={option} checked={preference === option} onChange={() => setTheme(option)} /><span>{labels[option]}</span></label>)}</fieldset>;
}
