import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { readQuranBookmark, type QuranBookmark } from "../lib/quranBookmark";

/** Reloads the khatma bookmark whenever the Quran list is focused. */
export function useQuranBookmark(): QuranBookmark | null {
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void readQuranBookmark().then((value) => {
        if (active) setBookmark(value);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return bookmark;
}
