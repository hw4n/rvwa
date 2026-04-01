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

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; hint: string }> = [
  {
    value: "system",
    label: "System",
    hint: "기기 설정을 따릅니다.",
  },
  {
    value: "light",
    label: "Light",
    hint: "밝은 표면과 어두운 텍스트를 사용합니다.",
  },
  {
    value: "dark",
    label: "Dark",
    hint: "어두운 표면과 밝은 텍스트를 사용합니다.",
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
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>테마는 현재 브라우저의 로컬 스토리지에 저장됩니다.</p>
          <p>
            현재 적용:{" "}
            <span className="font-semibold text-foreground">
              {getThemeLabel(appliedTheme)}
            </span>
            {preference === "system" ? " (시스템 기준)" : null}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const active = option.value === preference;
          return (
            <button
              aria-pressed={active}
              className={`space-y-2 border px-4 py-4 text-left transition-colors ${
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
              <p className="text-sm leading-relaxed">{option.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
