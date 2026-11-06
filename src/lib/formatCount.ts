const numberFormat = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return numberFormat.format(value);
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Non-negative integer from Western, Arabic-Indic or Persian digits; null for anything else. */
export function parseCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let western = "";
  for (const char of trimmed) {
    const indic = ARABIC_INDIC.indexOf(char);
    const persian = PERSIAN_DIGITS.indexOf(char);
    if (indic >= 0) western += String(indic);
    else if (persian >= 0) western += String(persian);
    else if (char >= "0" && char <= "9") western += char;
    else return null;
  }
  const value = Number(western);
  return Number.isFinite(value) ? value : null;
}

/** Keeps only digit characters while typing, so pasted text can't sneak letters in. */
export function digitsOnly(raw: string): string {
  return raw.replace(/[^\d٠-٩۰-۹]/g, "");
}

export function remainingCount(completed: number, target: number): number {
  return Math.max(0, target - completed);
}

export function completionRatio(completed: number, target: number): number {
  if (target <= 0) return completed > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, completed / target));
}

export function formatPercent(ratio: number): string {
  return `${Math.floor(ratio * 100)}%`;
}
