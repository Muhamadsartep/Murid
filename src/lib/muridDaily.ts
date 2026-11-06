import type { Language } from "./i18n";

export type MuridCountItem = {
  kind: "count";
  id: string;
  title: string;
  /** Arabic UI title, when `title` is Kurdish. */
  titleAr?: string;
  arabic?: string;
  target: number;
};

export type MuridCheckItem = {
  kind: "check";
  id: string;
  title: string;
  /** Arabic UI title, when `title` is Kurdish. */
  titleAr?: string;
};

export type MuridSection = {
  kind: "section";
  id: string;
  title: string;
  /** Arabic UI title, when `title` is Kurdish. */
  titleAr?: string;
};

export type MuridDailyEntry = MuridSection | MuridCountItem | MuridCheckItem;

/** Morning murid wird. Each count/check id is independent. */
export const MURID_DAILY: MuridDailyEntry[] = [
  {
    kind: "count",
    id: "audhu",
    title: "پێش نوێژی بەیانی",
    titleAr: "قبل صلاة الفجر",
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    target: 40,
  },
  {
    kind: "check",
    id: "fajr-sunnah",
    title: "نوێژی بەیانی بە هەموو سوننەتەکانییەوە",
    titleAr: "صلاة الفجر بجميع سننها",
  },
  {
    kind: "section",
    id: "section-tasbih",
    title: "تەسبیحاتی دوای نوێژ",
    titleAr: "تسبيحات ما بعد الصلاة",
  },
  {
    kind: "count",
    id: "subhanallah",
    title: "سُبْحَانَ اللَّهِ",
    arabic: "سُبْحَانَ اللَّهِ",
    target: 33,
  },
  {
    kind: "count",
    id: "alhamdulillah",
    title: "الْحَمْدُ لِلَّهِ",
    arabic: "الْحَمْدُ لِلَّهِ",
    target: 33,
  },
  {
    kind: "count",
    id: "allahu-akbar",
    title: "اللَّهُ أَكْبَرُ",
    arabic: "اللَّهُ أَكْبَرُ",
    target: 33,
  },
  {
    kind: "count",
    id: "tahlil-10",
    title: "لا اله الا الله وحده لا شریک له",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    target: 10,
  },
  {
    kind: "count",
    id: "ajirna",
    title: "اللهم اجرنا من النار",
    arabic: "اللَّهُمَّ أَجِرْنَا مِنَ النَّارِ",
    target: 10,
  },
  {
    kind: "count",
    id: "khallisna",
    title: "اللهم خلصنا من النار",
    arabic: "اللَّهُمَّ خَلِّصْنَا مِنَ النَّارِ",
    target: 10,
  },
  {
    kind: "count",
    id: "adkhilna",
    title: "اللهم ادخلنا الجنة",
    arabic: "اللَّهُمَّ أَدْخِلْنَا الْجَنَّةَ",
    target: 10,
  },
  {
    kind: "section",
    id: "section-zikr",
    title: "زیکر",
    titleAr: "الذكر",
  },
  {
    kind: "count",
    id: "lailaha-200",
    title: "لا اله الا الله",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    target: 200,
  },
  {
    kind: "count",
    id: "allah-300",
    title: "الله",
    arabic: "اللَّهُ",
    target: 300,
  },
  {
    kind: "count",
    id: "salawat-small",
    title: 'صلوات "کەمەکەی" (500 جار)',
    titleAr: "الصلاة الصغرى (500 مرة)",
    arabic: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّم",
    target: 500,
  },
  {
    kind: "count",
    id: "salawat-gilani",
    title: "صلواتی تایبەتی شێخ عبدالقادری گەیلانی (33 جار)",
    titleAr: "الصلاة الخاصة للشيخ عبد القادر الجيلاني (33 مرة)",
    arabic:
      "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ بَحْرِ أَنْوَارِكَ وَمَعْدِنِ أَسْرَارِكَ وَعَيْنِ عِنَايَتِكَ وَ شَمْسِ هِدَايَتِكَ * وَ عَرُوسِ مَمْلَكَتِكَ وَ أَمْنِ وِلَايَتِكَ وَ لِسَانِ مَحَبَّتِكَ وَ إِمَامِ حَضْرَتِكَ * وَ خَيْرِ خَلْقِكَ * وَ أَحَبِّ الْخَلْقِ إِلَيْكَ عَبْدِكَ وَ حَبِيبِكَ وَ رَسُولِكَ النَّبِيِّ الْأُمِّيِّ الَّذِي خَتَمْتَ بِهِ الْأَنْبِيَاءَ وَ الْمُرْسَلِينَ * وَ عَلَى مَلَائِكَتِكَ الْمُقَرَّبِينَ مِنْ أَهْلِ السَّمَوَاتِ وَ أَهْلِ الْأَرْضِينَ * رِضْوَانُ اللَّهِ تَعَالَى عَلَيْهِمْ أَجْمَعِينَ * بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ * وَ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ *",
    target: 33,
  },
];

const TARGETS: Record<string, number> = Object.fromEntries(
  MURID_DAILY.flatMap((entry) => {
    if (entry.kind === "count") return [[entry.id, entry.target]] as const;
    if (entry.kind === "check") return [[entry.id, 1]] as const;
    return [];
  }),
);

export function muridDailyTarget(id: string): number | undefined {
  return TARGETS[id];
}

export function muridProgressItems(): (MuridCountItem | MuridCheckItem)[] {
  return MURID_DAILY.filter(
    (entry): entry is MuridCountItem | MuridCheckItem => entry.kind !== "section",
  );
}

export function muridTitle(entry: { title: string; titleAr?: string }, language: Language): string {
  return language === "ar" && entry.titleAr ? entry.titleAr : entry.title;
}
