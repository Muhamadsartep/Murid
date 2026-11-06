import { normalizeArabic } from "./quran";

const BASMALA = normalizeArabic("بسم الله الرحمن الرحيم").replace(/\s+/g, "");

/**
 * Splits a leading full Basmalah from the rest of the text. Spelling (Uthmani or simple) and
 * harakat are ignored; texts that only begin with «بسم الله» (e.g. «بسم الله الذي لا يضر…») are
 * returned whole.
 */
export function splitBasmala(text: string): { basmala: string | null; rest: string } {
  let matched = 0;
  for (let i = 0; i < text.length; i++) {
    const folded = normalizeArabic(text[i]!).replace(/\s+/g, "");
    if (!folded) continue;
    if (folded !== BASMALA.slice(matched, matched + folded.length)) return { basmala: null, rest: text };
    matched += folded.length;
    if (matched === BASMALA.length) {
      let end = i + 1;
      while (end < text.length && normalizeArabic(text[end]!) === "" && !/\s/.test(text[end]!)) end++;
      const rest = text.slice(end).trim();
      if (!rest) return { basmala: null, rest: text };
      return { basmala: text.slice(0, end).trim(), rest };
    }
  }
  return { basmala: null, rest: text };
}
