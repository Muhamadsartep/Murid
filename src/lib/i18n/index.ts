import { ar } from "./ar";
import { ku } from "./ku";

export type Language = "ku" | "ar";

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : { readonly [K in keyof T]: Widen<T[K]> };

/** Shape every UI language must provide; derived from the Kurdish source table. */
export type Strings = Widen<typeof ku>;

export const LANGUAGES: readonly Language[] = ["ku", "ar"];

export function stringsFor(language: Language): Strings {
  return language === "ar" ? ar : ku;
}
