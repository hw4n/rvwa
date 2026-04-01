"use client";

import * as React from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  getSystemTheme,
  setStoredThemePreference,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  type AppliedTheme,
  type ThemePreference,
} from "@/lib/theme";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  {
    value: "system",
    label: "System",
  },
  {
    value: "light",
    label: "Light",
  },
  {
    value: "dark",
    label: "Dark",
  },
];

function getThemeLabel(theme: AppliedTheme) {
  return theme === "dark" ? "다크 모드" : "라이트 모드";
}

export function SettingsThemeForm() {
  const [preference, setPreference] = React.useState<ThemePreference>("system");
  const [appliedTheme, setAppliedTheme] = React.useState<AppliedTheme>("light");

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const syncThemeState = () => {
      const nextPreference = getStoredThemePreference();
      setPreference(nextPreference);
      setAppliedTheme(
        nextPreference === "system" ? getSystemTheme() : nextPreference
      );
    };

    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() === "system") {
        syncThemeState();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        syncThemeState();
      }
    };

    syncThemeState();
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function onSelect(nextPreference: ThemePreference) {
    setStoredThemePreference(nextPreference);
    setPreference(nextPreference);
    setAppliedTheme(applyThemePreference(nextPreference));
  }

  return (
    <section className="space-y-6 border border-border bg-surface-low p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
          Appearance
        </p>
        <p className="text-sm text-muted-foreground">
          적용중인 테마:{" "}
          <span className="font-semibold text-foreground">
            {getThemeLabel(appliedTheme)}
          </span>
          {preference === "system" ? " (시스템 설정)" : null}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const active = option.value === preference;
          return (
            <button
              aria-pressed={active}
              className={`border px-4 py-4 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface-lowest text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
            >
              <div className="text-xs font-black uppercase tracking-[0.25em]">
                {option.label}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
