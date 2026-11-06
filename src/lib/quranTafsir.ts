type ApiAyah = { numberInSurah?: number; text?: string };
type ApiEdition = { edition?: { identifier?: string }; ayahs?: ApiAyah[] };
type ApiResponse = { code?: number; data?: ApiEdition[] };

const ARABIC_EDITION = "quran-uthmani";
const KURDISH_EDITION = "ku.asan";

/** Uthmani text from the API sometimes includes a BOM or a thin space the mushaf font cannot draw. */
const HIDDEN = /[\uFEFF\u2009]/g;

export type SurahEditions = {
  arabic: readonly string[];
  tafsir: readonly string[];
};

/**
 * Arabic mushaf text and Kurdish Tafsir Nami (`ku.asan`) for one surah.
 * Each array is indexed by `ayah - 1`.
 */
export async function fetchSurahEditions(surahId: number, signal: AbortSignal): Promise<SurahEditions> {
  const response = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahId}/editions/${ARABIC_EDITION},${KURDISH_EDITION}`,
    { signal },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json = (await response.json()) as ApiResponse;
  const arabic = editionLines(json.data, ARABIC_EDITION, 0);
  const tafsir = editionLines(json.data, KURDISH_EDITION, 1);
  if (json.code !== 200 || !arabic || !tafsir) throw new Error("Unexpected response");

  return { arabic, tafsir };
}

function editionLines(data: ApiEdition[] | undefined, identifier: string, fallbackIndex: number): string[] | null {
  const edition = data?.find((item) => item.edition?.identifier === identifier) ?? data?.[fallbackIndex];
  if (!edition?.ayahs?.length) return null;

  const lines: string[] = [];
  for (const ayah of edition.ayahs) {
    if (!ayah.numberInSurah || !Number.isInteger(ayah.numberInSurah) || ayah.numberInSurah < 1) continue;
    lines[ayah.numberInSurah - 1] = (ayah.text ?? "").replace(HIDDEN, "").trim();
  }
  return lines.some((line) => line.length > 0) ? lines : null;
}
