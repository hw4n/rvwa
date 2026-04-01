"use client";

import * as React from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

export function ThemeController() {
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const syncTheme = () => {
      applyThemePreference(getStoredThemePreference());
    };

    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() === "system") {
        syncTheme();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        syncTheme();
      }
    };

    syncTheme();
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
