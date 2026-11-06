import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { stringsFor, type Language, type Strings } from "../lib/i18n";

const STORAGE_KEY = "zikr-tasbih.preferences.v1";

export const ARABIC_SCALE_MIN = 0.9;
export const ARABIC_SCALE_MAX = 1.8;
export const ARABIC_SCALE_STEP = 0.1;
export const ARABIC_SCALE_DEFAULT = 1.2;

type Preferences = { language: Language; arabicScale: number };

const DEFAULTS: Preferences = { language: "ku", arabicScale: ARABIC_SCALE_DEFAULT };

/** Steps are stored as tenths so repeated +/- never drifts off the grid. */
function clampScale(value: number): number {
  const stepped = Math.round(value * 10) / 10;
  return Math.min(ARABIC_SCALE_MAX, Math.max(ARABIC_SCALE_MIN, stepped));
}

function parse(raw: string | null): Preferences {
  if (!raw) return DEFAULTS;
  try {
    const value = JSON.parse(raw) as Partial<Preferences>;
    return {
      language: value.language === "ar" ? "ar" : "ku",
      arabicScale:
        typeof value.arabicScale === "number" && Number.isFinite(value.arabicScale)
          ? clampScale(value.arabicScale)
          : DEFAULTS.arabicScale,
    };
  } catch {
    return DEFAULTS;
  }
}

type PreferencesValue = Preferences & {
  ready: boolean;
  t: Strings;
  setLanguage: (language: Language) => void;
  stepArabicScale: (direction: 1 | -1) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) setPrefs(parse(raw));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: (current: Preferences) => Preferences) => {
    setPrefs((current) => {
      const next = patch(current);
      if (next === current) return current;
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const setLanguage = useCallback(
    (language: Language) => update((current) => (current.language === language ? current : { ...current, language })),
    [update],
  );

  const stepArabicScale = useCallback(
    (direction: 1 | -1) =>
      update((current) => {
        const arabicScale = clampScale(current.arabicScale + direction * ARABIC_SCALE_STEP);
        return arabicScale === current.arabicScale ? current : { ...current, arabicScale };
      }),
    [update],
  );

  const value = useMemo<PreferencesValue>(
    () => ({ ...prefs, ready, t: stringsFor(prefs.language), setLanguage, stepArabicScale }),
    [prefs, ready, setLanguage, stepArabicScale],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}

export function useStrings(): Strings {
  return usePreferences().t;
}

/** Font size and line height for religious Arabic text, scaled by the user's preference. */
export function useArabicText() {
  const { arabicScale } = usePreferences();
  return useCallback(
    (baseSize: number, lineRatio = 1.7) => {
      const fontSize = Math.round(baseSize * arabicScale);
      return { fontSize, lineHeight: Math.round(fontSize * lineRatio) };
    },
    [arabicScale],
  );
}
