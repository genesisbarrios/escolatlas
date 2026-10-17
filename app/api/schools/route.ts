import { NextRequest, NextResponse } from "next/server";
import { getAllSchools } from "@/lib/data";
import { applyFilters } from "@/lib/filters";
import { filtersFromParams } from "@/lib/query";

export async function GET(req: NextRequest) {
  const filters = filtersFromParams(req.nextUrl.searchParams);
  const items = applyFilters(getAllSchools(), filters);
  return NextResponse.json({ total: items.length, items });
}
