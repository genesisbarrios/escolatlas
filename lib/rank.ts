import type { School, SchoolFilters, SchoolLevel, SchoolSector } from "./school.ts";
import { LEVEL_LABELS, SECTOR_LABELS, gradeLabel, formatGrades } from "./school.ts";
import { distanceMiles } from "./geo.ts";

export interface RankedSchool {
  school: School;
  score: number;
  /** Human-readable reasons built only from the school's real attributes. */
  reasons: string[];
}

export interface MatchPreferences {
  filters: SchoolFilters;
}

/**
 * Deterministic scoring. Points are awarded only for stated preferences the
 * school actually satisfies; every point is mirrored by a reason string so the
 * UI can explain the ranking without inventing anything.
 */
export function rankSchools(
  schools: readonly School[],
  f: SchoolFilters,
): RankedSchool[] {
  const ranked = schools.map((s) => {
    let score = 0;
    const reasons: string[] = [];

    if (f.sectors?.length) {
      if (f.sectors.includes(s.sector)) {
        score += 2;
        reasons.push(`${SECTOR_LABELS[s.sector]} school`);
      }
    }
    if (f.levels?.length) {
      if (f.levels.includes(s.level)) {
        score += 3;
        reasons.push(`${LEVEL_LABELS[s.level]} school (${formatGrades(s)})`);
      }
    }
    if (f.grade !== undefined) {
      if (s.gradeMin <= f.grade && f.grade <= s.gradeMax) {
        score += 2;
        reasons.push(`Serves grade ${gradeLabel(f.grade)}`);
      } else {
        score -= 8; // hard miss: doesn't serve the requested grade
      }
    }
    if (f.city) {
      if (s.city.toLowerCase() === f.city.trim().toLowerCase()) {
        score += 3;
        reasons.push(`Located in ${s.city}`);
      }
    }
    if (f.program) {
      const hit = s.programs.find(
        (p) => p.toLowerCase() === f.program!.toLowerCase(),
      );
      if (hit) {
        score += 3;
        reasons.push(`${hit} program (from school name)`);
      }
    }
    if (f.minEnrollment !== undefined || f.maxEnrollment !== undefined) {
      if (s.enrollment === null) {
        // no data — neither rewarded nor penalized
      } else if (
        (f.minEnrollment === undefined || s.enrollment >= f.minEnrollment) &&
        (f.maxEnrollment === undefined || s.enrollment <= f.maxEnrollment)
      ) {
        score += 1;
        reasons.push(`${s.enrollment.toLocaleString()} students`);
      }
    }
    if (f.within && s.lat !== null && s.lng !== null) {
      const d = distanceMiles(s.lat, s.lng, f.within.lat, f.within.lng);
      if (d <= f.within.miles) {
        // 0–4 points, closer = more
        const pts = Math.round(4 * (1 - d / f.within.miles));
        score += Math.max(1, pts);
        reasons.push(`${d.toFixed(1)} mi away`);
      } else {
        score -= 4;
      }
    }
    if (f.preferStateGrade && s.stateGrade) {
      const pts = { A: 3, B: 2, C: 1 }[s.stateGrade] ?? 0;
      if (pts > 0) {
        score += pts;
        reasons.push(
          `Graded ${s.stateGrade} by FL DOE${s.stateGradeYear ? ` (${s.stateGradeYear})` : ""}`,
        );
      }
    }
    if (f.q) {
      const hay = `${s.name} ${s.city} ${s.address}`.toLowerCase();
      const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = terms.filter((t) => hay.includes(t)).length;
      if (hits > 0) score += hits;
    }

    return { school: s, score, reasons };
  });

  // Filtered constraints (grade, radius, city) already exclude hard misses via
  // applyFilters upstream; ranking only orders what remains.
  return ranked.sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name));
}
