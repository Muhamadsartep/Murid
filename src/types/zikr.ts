export type ZikrType = "asli" | "fari" | "asran";

export interface Zikr {
  id: string;
  type: ZikrType;
  title: string;
  target: number;
  completed: number;
}

/** `type` must match the JSON keys; `title` is display-only. */
export const ZIKR_SECTIONS: { type: ZikrType; title: string; titleAr: string; caption: string }[] = [
  { type: "asli", title: "ئەسڵی", titleAr: "أصلي", caption: "Asli" },
  { type: "fari", title: "فەرعی", titleAr: "فرعي", caption: "Fari" },
  { type: "asran", title: "عەسران", titleAr: "عصران", caption: "Asran" },
];
