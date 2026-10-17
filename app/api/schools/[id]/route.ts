import { NextResponse } from "next/server";
import { getSchool } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const school = getSchool(id);
  if (!school) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(school);
}
