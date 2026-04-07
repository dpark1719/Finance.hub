export type ThemeChoice = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "p1-theme";

export function readStoredTheme(): ThemeChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredTheme(t: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolved: should `<html>` have `dark` class? */
export function resolveDarkClass(choice: ThemeChoice | null): boolean {
  if (choice === "dark") return true;
  if (choice === "light") return false;
  if (choice === "system") return systemPrefersDark();
  return false;
}

export function applyThemeToDocument(choice: ThemeChoice | null): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDarkClass(choice));
}
