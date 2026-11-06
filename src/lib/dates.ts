import type { Language } from "./i18n";

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Saturday-first week. 0 = Saturday. */
export function saturdayIndex(date: Date): number {
  return (date.getDay() + 1) % 7;
}

/** Indexed by `Date#getDay()` (0 = Sunday). Hermes has no `ckb` Intl data, so names are mapped manually. */
const WEEKDAY_NAMES_KU = [
  "یەکشەممە",
  "دووشەممە",
  "سێشەممە",
  "چوارشەممە",
  "پێنجشەممە",
  "هەینی",
  "شەممە",
] as const;

const GREGORIAN_MONTHS_KU = [
  "کانوونی دووەم",
  "شوبات",
  "ئازار",
  "نیسان",
  "ئایار",
  "حوزەیران",
  "تەممووز",
  "ئاب",
  "ئەیلوول",
  "تشرینی یەکەم",
  "تشرینی دووەم",
  "کانوونی یەکەم",
] as const;

const HIJRI_MONTHS_KU = [
  "موحەڕڕەم",
  "سەفەر",
  "ڕەبیعولئەووەل",
  "ڕەبیعولئاخیر",
  "جەمادیولئەووەل",
  "جەمادیولئاخیر",
  "ڕەجەب",
  "شەعبان",
  "ڕەمەزان",
  "شەووال",
  "زولقەعدە",
  "زولحیججە",
] as const;

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toKurdishDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
}

type HijriDate = { year: number; month: number; day: number };

/** Umm al-Qura via Intl when the engine supports it, else the tabular (civil) calendar. */
function toHijri(date: Date): HijriDate {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    if (formatter.resolvedOptions().calendar.startsWith("islamic")) {
      const parts = formatter.formatToParts(date);
      const read = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      const result = { year: read("year"), month: read("month"), day: read("day") };
      if (Number.isFinite(result.year) && result.month >= 1 && result.month <= 12) return result;
    }
  } catch {
    // Fall through to the arithmetic calendar.
  }
  return tabularHijri(date);
}

function tabularHijri(date: Date): HijriDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  const jd =
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

const WEEKDAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

const GREGORIAN_MONTHS_AR = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
] as const;

const HIJRI_MONTHS_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

/** Kurdish attaches the izafe «ی» to the day number; Arabic does not. */
function dayLabel(day: number, language: Language): string {
  return language === "ar" ? toKurdishDigits(day) : `${toKurdishDigits(day)}ی`;
}

export function formatWeekday(date = new Date(), language: Language = "ku"): string {
  return (language === "ar" ? WEEKDAY_NAMES_AR : WEEKDAY_NAMES_KU)[date.getDay()];
}

export function formatGregorian(date = new Date(), language: Language = "ku"): string {
  const months = language === "ar" ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_KU;
  return `${dayLabel(date.getDate(), language)} ${months[date.getMonth()]} ${toKurdishDigits(date.getFullYear())}`;
}

export function formatHijri(date = new Date(), language: Language = "ku"): string {
  const { year, month, day } = toHijri(date);
  const months = language === "ar" ? HIJRI_MONTHS_AR : HIJRI_MONTHS_KU;
  return `${dayLabel(day, language)} ${months[month - 1]} ${toKurdishDigits(year)}`;
}

export function formatMonthTitle(year: number, month: number, language: Language = "ku"): string {
  return `${(language === "ar" ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_KU)[month]} ${toKurdishDigits(year)}`;
}

/** Saturday-first headers. */
const WEEKDAYS_KU = ["ش", "ی", "د", "س", "چ", "پ", "ه"] as const;
const WEEKDAYS_AR = ["س", "ح", "ن", "ث", "ر", "خ", "ج"] as const;

export function weekdayHeaders(language: Language = "ku"): readonly string[] {
  return language === "ar" ? WEEKDAYS_AR : WEEKDAYS_KU;
}
