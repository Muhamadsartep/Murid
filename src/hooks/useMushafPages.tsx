import { useMemo, useState } from "react";
import type { TextLayoutLine } from "react-native";

import {
  fitPage,
  lineStartsFromLayout,
  pageCapacity,
  paginateMushaf,
  type MushafFlow,
  type MushafMetrics,
  type MushafPage,
} from "../lib/mushaf";

type Corrected = { key: string; pages: MushafPage[] };

const CACHE_LIMIT = 24;
const cache = new Map<string, MushafPage[]>();
const EMPTY: MushafPage[] = [];

function remember(key: string, pages: MushafPage[]) {
  cache.delete(key);
  cache.set(key, pages);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

/**
 * Pages for the reader. The flow is pre-chunked synchronously on estimated line breaks, so the list
 * always receives whole, non-empty pages. Each rendered page then reports its real layout through
 * `onPageLayout`; a page that would run past its frame is trimmed at a measured line break and the
 * following pages are re-chunked from there.
 */
export function useMushafPages(
  flow: MushafFlow | null,
  metrics: MushafMetrics,
  textWidth: number,
  textHeight: number,
  reserveFirst: number,
): {
  pages: MushafPage[];
  onPageLayout: (pageId: string, pageIndex: number, lines: readonly TextLayoutLine[]) => void;
} {
  const ready = flow != null && flow.ayahs.length > 0 && textWidth >= 40 && textHeight >= metrics.line;
  const key = ready
    ? `${flow.key}:${metrics.font}/${metrics.line}:${Math.round(textWidth)}:${Math.round(textHeight)}:${reserveFirst}`
    : "";
  const fullLines = pageCapacity(metrics, textHeight);
  const firstLines = pageCapacity(metrics, textHeight, reserveFirst);

  const estimated = useMemo(() => {
    if (!key || !flow) return EMPTY;
    return cache.get(key) ?? paginateMushaf(flow, metrics, textWidth, textHeight, reserveFirst);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers flow, metrics, size and reserve.
  }, [key]);

  const [corrected, setCorrected] = useState<Corrected | null>(null);
  const pages = corrected?.key === key ? corrected.pages : estimated;

  const onPageLayout = (pageId: string, pageIndex: number, lines: readonly TextLayoutLine[]) => {
    if (!flow || !key || lines.length <= (pageIndex === 0 ? firstLines : fullLines)) return;
    const lineStarts = lineStartsFromLayout(lines);
    setCorrected((prev) => {
      const current = prev?.key === key ? prev.pages : estimated;
      const page = current[pageIndex];
      if (!page || page.id !== pageId) return prev;
      const fit = fitPage(flow, page, lineStarts, pageIndex === 0 ? firstLines : fullLines, fullLines);
      if (!fit) return prev;
      const rest = paginateMushaf(flow, metrics, textWidth, textHeight, reserveFirst, fit.next, pageIndex + 1);
      const next = [...current.slice(0, pageIndex), fit.page, ...rest];
      remember(key, next);
      return { key, pages: next };
    });
  };

  return { pages, onPageLayout };
}
