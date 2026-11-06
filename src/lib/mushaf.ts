import { normalizeArabic, type Surah } from "./quran";

/**
 * KFGQPC HAFS Uthmanic Script ligates a run of Arabic-Indic digits into the numbered
 * end-of-ayah ornament, as on Quran.com. Prefixing U+06DD would draw a second, empty ornament.
 */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const NBSP = "\u00A0";
/** The source text has one U+2009 (2:72) that the font has no glyph for; the KFGQPC text has none. */
const THIN_SPACE = /\u2009/g;

/**
 * Kept in sync with the reader page text style. The font's ascent + descent is 1.758em, so this
 * line height holds stacked harakat and Quranic marks without clipping or overlap.
 */
export const MUSHAF_PAGE_FONT = 26;
export const MUSHAF_PAGE_LINE = 46;

/** Page text size; the line height keeps the base font's ratio so marks never clip. */
export type MushafMetrics = { font: number; line: number };

export function mushafMetrics(scale: number): MushafMetrics {
  const font = Math.round(MUSHAF_PAGE_FONT * scale);
  return { font, line: Math.round((font * MUSHAF_PAGE_LINE) / MUSHAF_PAGE_FONT) };
}

/**
 * Space taken by the page frame around the text block, kept in sync with `MushafPageView`:
 * outer padding (12 / 6 per side) + 1px border + inner padding (16 / 20 per side).
 */
export const MUSHAF_TEXT_H_INSET = 2 * (12 + 1 + 16);
export const MUSHAF_TEXT_V_INSET = 2 * (6 + 1 + 20);

/** One ayah on a page, or one line-aligned part of an ayah that spans several pages. */
export type MushafPageAyah = {
  /** Position of the ayah in the flow. */
  index: number;
  n: number;
  /** Offset of `text` inside the ayah's full text; non-zero for a continued part. */
  offset: number;
  text: string;
};

export type MushafPage = {
  id: string;
  from: number;
  to: number;
  ayahs: MushafPageAyah[];
};

/** Every ayah of a reading session, in reading order. */
export type MushafFlow = {
  key: string;
  surahId: number;
  ayahs: MushafPageAyah[];
};

/** Reading position: ayah index in the flow and UTF-16 offset into that ayah's text. */
export type MushafCursor = { index: number; offset: number };

type WindowSegment = {
  index: number;
  n: number;
  /** Offset of this segment inside the ayah's full text. */
  offset: number;
  /** Offset of this segment inside the window text. */
  start: number;
  text: string;
};

/** The text measured for one page: whole ayahs from the cursor onward, laid out from a fresh line. */
export type MushafWindow = {
  text: string;
  segments: WindowSegment[];
  atEnd: boolean;
};

export type MushafStep =
  | { kind: "page"; ayahs: MushafPageAyah[]; next: MushafCursor | null }
  | { kind: "grow" };

export function toArabicIndic(value: number): string {
  const digits = String(Math.trunc(Math.abs(value)));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    out += ARABIC_INDIC[digits.charCodeAt(i) - 48] ?? "";
  }
  return out;
}

function endOfAyah(ayah: number): string {
  return toArabicIndic(ayah);
}

/** Western or Arabic-Indic digits only. Returns null when the query contains any other character. */
export function parseAyahQuery(query: string): number | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  let western = "";
  for (const char of trimmed) {
    const indic = ARABIC_INDIC.indexOf(char);
    if (indic >= 0) western += String(indic);
    else if (char >= "0" && char <= "9") western += char;
    else return null;
  }
  const ayah = Number(western);
  return ayah >= 1 ? ayah : null;
}

function verseText(surah: Surah, ayah: number): string {
  const body = (surah.verses[ayah - 1] ?? "").replace(THIN_SPACE, "").trim();
  return body ? `${body}${NBSP}${endOfAyah(ayah)}` : endOfAyah(ayah);
}

/** Text for a page: its ayahs joined into one inline run, exactly as the page was measured. */
export function pageText(page: MushafPage): string {
  return page.ayahs.map((ayah) => ayah.text).join(" ");
}

export function buildMushafFlow(surah: Surah, ayahs: readonly number[]): MushafFlow {
  let hash = 2166136261;
  const items: MushafPageAyah[] = [];
  for (const n of ayahs) {
    hash ^= n;
    hash = Math.imul(hash, 16777619);
    items.push({ index: items.length, n, offset: 0, text: verseText(surah, n) });
  }
  return { key: `${surah.id}:${ayahs.length}:${hash >>> 0}`, surahId: surah.id, ayahs: items };
}

export function pageCapacity(metrics: MushafMetrics, textHeight: number, reserve = 0): number {
  return Math.max(1, Math.floor((textHeight - Math.max(0, reserve)) / metrics.line));
}

/** Characters to measure for one page: a generous over-estimate, grown on demand. */
export function windowBudget(metrics: MushafMetrics, textWidth: number, capacity: number): number {
  const perLine = Math.max(12, Math.ceil(textWidth / (metrics.font * 0.45)));
  return perLine * (capacity + 2);
}

export function buildWindow(flow: MushafFlow, cursor: MushafCursor, budget: number): MushafWindow {
  const segments: WindowSegment[] = [];
  let text = "";
  let index = cursor.index;
  let offset = cursor.offset;
  while (index < flow.ayahs.length && (segments.length === 0 || text.length < budget)) {
    const ayah = flow.ayahs[index]!;
    if (segments.length > 0) text += " ";
    const part = offset > 0 ? ayah.text.slice(offset) : ayah.text;
    segments.push({ index, n: ayah.n, offset, start: text.length, text: part });
    text += part;
    index++;
    offset = 0;
  }
  return { text, segments, atEnd: index >= flow.ayahs.length };
}

/** Start offset of every rendered line, from the line strings reported by `onTextLayout`. */
export function lineStartsFromLayout(lines: readonly { text: string }[]): number[] {
  const starts = new Array<number>(lines.length);
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    starts[i] = offset;
    offset += lines[i]?.text.length ?? 0;
  }
  return starts;
}

/** Harakat, Quranic annotation marks and small letters stack on the base glyph and add no width. */
function isCombining(code: number): boolean {
  return (
    (code >= 0x0610 && code <= 0x061a) ||
    (code >= 0x064b && code <= 0x065f) ||
    code === 0x0670 ||
    (code >= 0x06d6 && code <= 0x06dc) ||
    (code >= 0x06df && code <= 0x06e8) ||
    (code >= 0x06ea && code <= 0x06ed) ||
    (code >= 0x08d3 && code <= 0x08ff)
  );
}

function isArabicIndicDigit(code: number): boolean {
  return code >= 0x0660 && code <= 0x0669;
}

/**
 * Estimated advance in em of one UTF-16 unit, from KFGQPC HAFS shaped over the whole Quran:
 * joined letters average 0.371em, a space is 0.22em, and an ayah-number ornament is 0.779em
 * whatever its digit count.
 */
function advanceEm(code: number, prev: number): number {
  if (isCombining(code)) return 0;
  if (code === 0x20 || code === 0xa0) return 0.22;
  if (isArabicIndicDigit(code)) return isArabicIndicDigit(prev) ? 0 : 0.78;
  return 0.38;
}

/** Greedy word wrap on estimated glyph widths. Breaks only at regular spaces, like the native layout. */
export function estimateLineStarts(metrics: MushafMetrics, text: string, textWidth: number): number[] {
  const limit = textWidth / metrics.font;
  const starts = [0];
  let width = 0;
  let lastSpace = -1;
  let widthThroughSpace = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    width += advanceEm(code, i > 0 ? text.charCodeAt(i - 1) : 0);
    if (code === 0x20) {
      lastSpace = i;
      widthThroughSpace = width;
      continue;
    }
    if (width > limit && lastSpace >= 0) {
      starts.push(lastSpace + 1);
      width -= widthThroughSpace;
      lastSpace = -1;
    }
  }
  return starts;
}

function lineOf(lineStarts: readonly number[], offset: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((lineStarts[mid] ?? 0) <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Cut one page from a measured window. The window starts exactly where the page starts, so its
 * line breaks are the page's line breaks.
 *
 * Whole ayahs are kept together. An ayah that needs more than a full page on its own fills the
 * remaining lines of the current page and continues on the next, split at a line break; only its
 * last part carries the end-of-ayah marker.
 */
export function paginateStep(
  window: MushafWindow,
  lineStarts: readonly number[],
  capacity: number,
  fullCapacity: number,
): MushafStep {
  const { segments } = window;
  if (lineStarts.length <= capacity) {
    if (!window.atEnd) return { kind: "grow" };
    return { kind: "page", ayahs: segments.map(toPageAyah), next: null };
  }

  const boundary = lineStarts[capacity]!;
  let fit = 0;
  while (fit < segments.length && segments[fit]!.start + segments[fit]!.text.length <= boundary) fit++;

  // Windows hold whole ayah remainders, so the next ayah's line span is fully measured here.
  let cut = boundary;
  if (fit > 0) {
    const next = segments[fit];
    const prev = segments[fit - 1]!;
    const nextLines = next
      ? lineOf(lineStarts, next.start + next.text.length - 1) - lineOf(lineStarts, next.start) + 1
      : 0;
    if (!next || nextLines <= fullCapacity) cut = prev.start + prev.text.length;
  }

  const ayahs: MushafPageAyah[] = [];
  let nextCursor: MushafCursor | null = null;
  for (const segment of segments) {
    if (segment.start >= cut) {
      nextCursor ??= { index: segment.index, offset: segment.offset };
      break;
    }
    const end = segment.start + segment.text.length;
    if (end <= cut) {
      ayahs.push(toPageAyah(segment));
      continue;
    }
    const head = segment.text.slice(0, cut - segment.start).replace(/ +$/, "");
    if (head) ayahs.push({ ...toPageAyah(segment), text: head });
    nextCursor = { index: segment.index, offset: segment.offset + (cut - segment.start) };
    break;
  }
  if (!nextCursor && !window.atEnd) {
    const last = segments[segments.length - 1]!;
    nextCursor = { index: last.index + 1, offset: 0 };
  }
  return { kind: "page", ayahs, next: nextCursor };
}

function toPageAyah({ index, n, offset, text }: WindowSegment): MushafPageAyah {
  return { index, n, offset, text };
}

function makePage(surahId: number, ayahs: MushafPageAyah[]): MushafPage {
  const first = ayahs[0]!;
  const last = ayahs[ayahs.length - 1]!;
  return {
    id: `${surahId}:${first.n}.${first.offset}:${last.n}.${last.offset + last.text.length}`,
    from: first.n,
    to: last.n,
    ayahs,
  };
}

/**
 * Pre-chunk a flow into pages on estimated line breaks, starting at `start`. Runs synchronously,
 * before the pages reach the list. Pages are never empty. `firstIndex` is the index of the first
 * page produced, so only page 0 reserves room for the Basmalah.
 */
export function paginateMushaf(
  flow: MushafFlow,
  metrics: MushafMetrics,
  textWidth: number,
  textHeight: number,
  reserveFirst: number,
  start: MushafCursor = { index: 0, offset: 0 },
  firstIndex = 0,
): MushafPage[] {
  const full = pageCapacity(metrics, textHeight);
  const first = pageCapacity(metrics, textHeight, reserveFirst);
  const pages: MushafPage[] = [];
  let cursor: MushafCursor | null = start.index < flow.ayahs.length ? start : null;
  let budget = windowBudget(metrics, textWidth, full);
  while (cursor) {
    const window = buildWindow(flow, cursor, budget);
    const capacity = firstIndex + pages.length === 0 ? first : full;
    const step = paginateStep(window, estimateLineStarts(metrics, window.text, textWidth), capacity, full);
    if (step.kind === "grow") {
      budget *= 2;
      continue;
    }
    if (step.ayahs.length > 0) pages.push(makePage(flow.surahId, step.ayahs));
    cursor = step.next;
    budget = windowBudget(metrics, textWidth, full);
  }
  return pages;
}

/**
 * Trim a rendered page to its real capacity using the line breaks `onTextLayout` reported for it.
 * Returns the trimmed page and where the next page must start, or null when the page already fits.
 */
export function fitPage(
  flow: MushafFlow,
  page: MushafPage,
  lineStarts: readonly number[],
  capacity: number,
  fullCapacity: number,
): { page: MushafPage; next: MushafCursor } | null {
  if (lineStarts.length <= capacity) return null;
  const segments: WindowSegment[] = [];
  let text = "";
  for (const ayah of page.ayahs) {
    if (segments.length > 0) text += " ";
    segments.push({ ...ayah, start: text.length });
    text += ayah.text;
  }
  const step = paginateStep({ text, segments, atEnd: true }, lineStarts, capacity, fullCapacity);
  if (step.kind !== "page" || !step.next || step.ayahs.length === 0) return null;
  return { page: makePage(flow.surahId, step.ayahs), next: step.next };
}

/** Ayah numbers whose text contains the query. Diacritics are ignored. */
export function matchingAyahNumbers(surah: Surah, query: string): number[] {
  const needle = normalizeArabic(query);
  if (!needle) return [];
  const matches: number[] = [];
  for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
    const verse = surah.verses[ayah - 1] ?? "";
    if (normalizeArabic(verse).includes(needle)) matches.push(ayah);
  }
  return matches;
}
