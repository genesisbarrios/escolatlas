import type { SchoolFilters, SchoolLevel, SchoolSector } from "./school.ts";
import { parseGradeParam } from "./filters.ts";

const SECTORS: SchoolSector[] = ["public", "charter", "private"];
const LEVELS: SchoolLevel[] = [
  "early", "elementary", "middle", "high", "k8", "k12", "secondary", "other",
];

function num(v: string | null | undefined): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function filtersFromParams(
  p: URLSearchParams | Record<string, string | string[] | undefined>,
): SchoolFilters {
  const get = (k: string): string | null => {
    if (p instanceof URLSearchParams) return p.get(k);
    const v = p[k];
    return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  };
  const f: SchoolFilters = {};

  const q = get("q")?.trim();
  if (q) f.q = q;

  const sectors = (get("sector") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SchoolSector => (SECTORS as string[]).includes(s));
  if (sectors.length) f.sectors = sectors;

  const levels = (get("level") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SchoolLevel => (LEVELS as string[]).includes(s));
  if (levels.length) f.levels = levels;

  const grade = parseGradeParam(get("grade"));
  if (grade !== undefined) f.grade = grade;

  const city = get("city")?.trim();
  if (city) f.city = city;
  const zip = get("zip")?.trim();
  if (zip) f.zip = zip;
  const program = get("program")?.trim();
  if (program) f.program = program;

  const sg = get("stateGrade")?.trim().toUpperCase();
  if (sg && /^[A-F]$/.test(sg)) f.stateGrade = sg;

  const minE = num(get("minEnrollment"));
  if (minE !== undefined) f.minEnrollment = minE;
  const maxE = num(get("maxEnrollment"));
  if (maxE !== undefined) f.maxEnrollment = maxE;

  const lat = num(get("lat"));
  const lng = num(get("lng"));
  const miles = num(get("miles"));
  if (lat !== undefined && lng !== undefined && miles !== undefined && miles > 0) {
    f.within = { lat, lng, miles };
  }

  return f;
}
