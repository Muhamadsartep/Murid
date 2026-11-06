import data from "../data/biographies.json";

export type Biography = {
  id: number;
  name: string;
  biography: string;
  description?: string;
  features?: string[];
  martyrdom?: string;
  dates?: string;
  achievements?: string[];
  poetry?: string;
};

export const biographies = data as Biography[];

export function getBiography(id: number): Biography | undefined {
  return biographies.find((item) => item.id === id);
}
