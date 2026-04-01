export const THEME_STORAGE_KEY = "rvwa-theme";
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "system" | "light" | "dark";
export type AppliedTheme = "light" | "dark";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveAppliedTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): AppliedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(value) ? value : "system";
}

export function setStoredThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function getSystemTheme(): AppliedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function applyResolvedTheme(theme: AppliedTheme) {
  if (typeof document === "undefined") {
    return theme;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  return theme;
}

export function applyThemePreference(preference: ThemePreference) {
  return applyResolvedTheme(resolveAppliedTheme(preference, getSystemTheme() === "dark"));
}

export function getThemeInitializationScript() {
  return `
    (() => {
      try {
        const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
        const mediaQuery = ${JSON.stringify(THEME_MEDIA_QUERY)};
        const root = document.documentElement;
        const value = window.localStorage.getItem(storageKey);
        const preference =
          value === "light" || value === "dark" || value === "system" ? value : "system";
        const systemPrefersDark = window.matchMedia(mediaQuery).matches;
        const theme = preference === "system"
          ? systemPrefersDark ? "dark" : "light"
          : preference;

        root.classList.toggle("dark", theme === "dark");
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
      } catch {
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;
}
