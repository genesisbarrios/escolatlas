import type { School, SchoolFilters } from "./school.ts";
import { distanceMiles } from "./geo.ts";

/** Deterministic filtering. Every rule is pure AND-composition. */
export function applyFilters(schools: readonly School[], f: SchoolFilters): School[] {
  return schools.filter((s) => {
    if (f.sectors?.length && !f.sectors.includes(s.sector)) return false;
    if (f.levels?.length && !f.levels.includes(s.level)) return false;
    if (f.grade !== undefined && !(s.gradeMin <= f.grade && f.grade <= s.gradeMax))
      return false;
    if (f.city && !s.city.toLowerCase().includes(f.city.trim().toLowerCase()))
      return false;
    if (f.zip && s.zip !== f.zip.trim()) return false;
    if (
      f.program &&
      !s.programs.some((p) => p.toLowerCase() === f.program!.toLowerCase())
    )
      return false;
    if (f.stateGrade && s.stateGrade !== f.stateGrade.toUpperCase())
      return false;
    if (f.minEnrollment !== undefined && (s.enrollment ?? 0) < f.minEnrollment)
      return false;
    if (
      f.maxEnrollment !== undefined &&
      s.enrollment !== null &&
      s.enrollment > f.maxEnrollment
    )
      return false;
    if (f.within) {
      if (s.lat === null || s.lng === null) return false;
      if (distanceMiles(s.lat, s.lng, f.within.lat, f.within.lng) > f.within.miles)
        return false;
    }
    if (f.q) {
      const hay = `${s.name} ${s.city} ${s.address} ${s.zip}`.toLowerCase();
      const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

/** Parse an unknown grade token from a UI/API string. Accepts "PK","K","3", etc. */
export function parseGradeParam(v: string | null | undefined): number | undefined {
  if (v === null || v === undefined || v.trim() === "") return undefined;
  const t = v.trim().toUpperCase();
  if (t === "PK" || t === "PREK" || t === "PRE-K" || t === "VPK") return -1;
  if (t === "K" || t === "KG") return 0;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
  return undefined;
}
