import {
  cityCentroid,
  getAllSchools,
  listCities,
  zipCentroid,
} from "./data.ts";
import { applyFilters } from "./filters.ts";
import { parsePreference } from "./nlp.ts";
import { parseWithLLM } from "./llm.ts";
import { rankSchools } from "./rank.ts";
import type { RankedSchool } from "./rank.ts";
import type { SchoolFilters } from "./school.ts";

export interface MatchResult {
  query: string;
  parser: "llm" | "heuristic";
  recognized: string[];
  filters: SchoolFilters;
  /** All matches, ranked — callers may slice for display limits. */
  results: RankedSchool[];
}

/** Shared natural-language match pipeline: parse → filter → rank. */
export async function runMatch(input: string): Promise<MatchResult> {
  const llm = await parseWithLLM(input);
  const parsed = llm ?? parsePreference(input, GEO);
  const nf = parsed.filters as SchoolFilters & {
    __nearPlace?: string;
    __nearMiles?: number;
  };
  if (nf.__nearPlace) {
    const c = cityCentroid(nf.__nearPlace) ?? zipCentroid(nf.__nearPlace);
    if (c) {
      parsed.filters.within = { ...c, miles: nf.__nearMiles ?? 5 };
      delete nf.__nearPlace;
      delete nf.__nearMiles;
    }
  }
  const filtered = applyFilters(getAllSchools(), parsed.filters);
  return {
    query: input,
    parser: llm ? "llm" : "heuristic",
    recognized: parsed.recognized,
    filters: parsed.filters,
    results: rankSchools(filtered, parsed.filters),
  };
}

const GEO = {
  get cities() {
    return listCities();
  },
  cityCentroid,
  zipCentroid,
};
