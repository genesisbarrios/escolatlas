import { NextRequest, NextResponse } from "next/server";
import {
  cityCentroid,
  getAllSchools,
  listCities,
  zipCentroid,
} from "@/lib/data";
import { applyFilters } from "@/lib/filters";
import { parsePreference } from "@/lib/nlp";
import { parseWithLLM } from "@/lib/llm";
import { rankSchools } from "@/lib/rank";

const GEO = {
  get cities() {
    return listCities();
  },
  cityCentroid,
  zipCentroid,
};

async function respond(input: string) {
  const llm = await parseWithLLM(input);
  const parsed = llm ?? parsePreference(input, GEO);
  const nf = parsed.filters as typeof parsed.filters & {
    __nearPlace?: string;
    __nearMiles?: number;
  };
  if (nf.__nearPlace) {
    const c =
      cityCentroid(nf.__nearPlace) ?? zipCentroid(nf.__nearPlace);
    if (c) {
      parsed.filters.within = { ...c, miles: nf.__nearMiles ?? 5 };
      delete nf.__nearPlace;
      delete nf.__nearMiles;
    }
  }
  const filtered = applyFilters(getAllSchools(), parsed.filters);
  const ranked = rankSchools(filtered, parsed.filters);
  return NextResponse.json({
    query: input,
    parser: llm ? "llm" : "heuristic",
    recognized: parsed.recognized,
    filters: parsed.filters,
    total: ranked.length,
    results: ranked.slice(0, 25),
  });
}

export async function GET(req: NextRequest) {
  return respond(req.nextUrl.searchParams.get("q") ?? "");
}

export async function POST(req: NextRequest) {
  let input = "";
  try {
    const body = await req.json();
    input = typeof body?.query === "string" ? body.query : "";
  } catch {
    // malformed JSON → treat as empty query; deterministic empty result below
  }
  return respond(input);
}
