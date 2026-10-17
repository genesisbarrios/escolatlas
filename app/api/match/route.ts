import { NextRequest, NextResponse } from "next/server";
import {
  cityCentroid,
  getAllSchools,
  listCities,
  zipCentroid,
} from "@/lib/data";
import { applyFilters } from "@/lib/filters";
import { parsePreference } from "@/lib/nlp";
import { rankSchools } from "@/lib/rank";

const GEO = {
  get cities() {
    return listCities();
  },
  cityCentroid,
  zipCentroid,
};

function respond(input: string) {
  const parsed = parsePreference(input, GEO);
  const filtered = applyFilters(getAllSchools(), parsed.filters);
  const ranked = rankSchools(filtered, parsed.filters);
  return NextResponse.json({
    query: input,
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
