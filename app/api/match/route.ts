import { NextRequest, NextResponse } from "next/server";
import { runMatch } from "@/lib/match";

async function respond(input: string) {
  const m = await runMatch(input);
  return NextResponse.json({
    query: input,
    parser: m.parser,
    recognized: m.recognized,
    filters: m.filters,
    total: m.results.length,
    results: m.results.slice(0, 25),
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
