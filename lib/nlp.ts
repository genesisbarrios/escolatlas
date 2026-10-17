import type { SchoolFilters, SchoolLevel, SchoolSector } from "./school.ts";

/**
 * Heuristic natural-language preference parser.
 *
 * Deterministic, offline, and explainable: it extracts school-search signals
 * (level, sector, grade, city, program, size, distance) from free text and
 * produces a validated SchoolFilters object. It never throws on malformed
 * input — unrecognized text becomes a free-text search or is ignored.
 *
 * This is the seam where a real LLM provider can plug in later: the function
 * signature (text → structured filters) stays the same.
 */

export interface GeoResolver {
  cities: string[];
  cityCentroid(name: string): { lat: number; lng: number } | null;
  zipCentroid(zip: string): { lat: number; lng: number } | null;
}

export interface ParsedPreference {
  filters: SchoolFilters;
  /** What the parser understood — shown to the user for transparency. */
  recognized: string[];
  /** Free text that didn't map to a structured filter. */
  freeText?: string;
}

const STOPWORDS = new Set([
  "a", "an", "the", "for", "my", "our", "their", "i", "we", "me", "us",
  "want", "need", "looking", "find", "search", "show", "school", "schools",
  "with", "that", "has", "have", "good", "great", "best", "kid", "kids",
  "child", "children", "daughter", "son", "student", "students", "would",
  "like", "please", "some", "any", "of", "to", "and", "or", "in", "at",
  "is", "are", "be", "near", "close", "around", "miami-dade", "miami",
  "dade", "county", "area", "prefer", "preferably",
]);

const LEVEL_PHRASES: [RegExp, string, SchoolLevel[]][] = [
  [/\b(?:preschool|early learning|daycare|childcare)\b/i, "early learning", ["early"]],
  [/\belementary\b/i, "elementary", ["elementary", "k8", "k12"]],
  [/\bmiddle school|\bjunior high\b|\bmiddle\b/i, "middle school", ["middle", "k8", "secondary", "k12"]],
  [/\bhigh school|\bsenior high|\bhigh\b/i, "high school", ["high", "secondary", "k12"]],
  [/\bk-?8\b/i, "K-8", ["k8", "k12"]],
  [/\bk-?12\b/i, "K-12", ["k12"]],
];

const PROGRAM_PHRASES: [RegExp, string][] = [
  [/\bs\.?t\.?e\.?a?m\.?\b|science|technology|engineering|robotics|coding/i, "STEM"],
  [/montessori/i, "Montessori"],
  [/\barts?\b|music|theat(er|re)|drama|performing/i, "Arts & music"],
  [/magnet/i, "Magnet"],
  [/international|baccalaureate|\bib\b/i, "International studies"],
  [/dual language|bilingual|spanish/i, "Dual language"],
  [/career|technical|vocational/i, "Career & technical"],
  [/college prep|preparatory/i, "College prep"],
];

function gradeFromToken(t: string): number | null {
  const s = t.trim().toLowerCase();
  if (/^(pre-?k|pk|vpk|preschool)$/.test(s)) return -1;
  if (/^(k|kg|kindergarten)$/.test(s)) return 0;
  const m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) return n;
  }
  return null;
}

export function parsePreference(input: string, geo: GeoResolver): ParsedPreference {
  const recognized: string[] = [];
  const filters: SchoolFilters = {};
  let text = ` ${String(input ?? "").toLowerCase()} `;

  const consume = (re: RegExp, onMatch: (m: RegExpMatchArray) => void): boolean => {
    const m = text.match(re);
    if (!m) return false;
    onMatch(m);
    text = text.replace(m[0], " ");
    return true;
  };

  // 1. "within N miles of <place|zip>" — distance constraint (resolve to a point)
  consume(
    /within\s+(\d+(?:\.\d+)?)\s*(?:mi|miles?)\s+of\s+([a-z0-9 -]+?)(?=[,.;]|$)/,
    (m) => {
      const miles = Number(m[1]);
      const words = m[2].trim().split(/\s+/);
      // Try the longest place-name prefix first ("north miami beach school" → "north miami beach")
      for (let i = words.length; i > 0; i--) {
        const place = words.slice(0, i).join(" ");
        const pt = /^\d{5}$/.test(place)
          ? geo.zipCentroid(place)
          : geo.cityCentroid(place);
        if (pt) {
          filters.within = { ...pt, miles };
          recognized.push(`within ${miles} mi of ${place}`);
          return;
        }
      }
    },
  );

  // 2. Bare zip code → zip filter
  consume(/\b(33\d{3})\b/, (m) => {
    filters.zip = m[1];
    recognized.push(`zip ${m[1]}`);
  });

  // 3. "in|near|around|close to <city>" — match known cities, longest first
  const cities = [...geo.cities].sort((a, b) => b.length - a.length);
  for (const city of cities) {
    const re = new RegExp(
      `\\b(?:in|near|around|close to|from)\\s+${city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    );
    if (
      consume(re, () => {
        filters.city = city;
        recognized.push(`in ${city}`);
      })
    )
      break;
  }
  // City mentioned bare (e.g. "Coral Gables elementary school")
  if (!filters.city) {
    for (const city of cities) {
      const re = new RegExp(`\\b${city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (
        consume(re, () => {
          filters.city = city;
          recognized.push(`in ${city}`);
        })
      )
        break;
    }
  }

  // 4. Level phrases (longest/most specific patterns first)
  for (const [re, label, levels] of LEVEL_PHRASES) {
    if (filters.levels) break;
    consume(re, () => {
      filters.levels = levels;
      recognized.push(label);
    });
  }

  // 5. Explicit grade: "3rd grade", "grade 5", "kindergarten", "pre-k"/"vpk" → PK
  consume(/\b(?:pre-?k|pk|vpk)\b/, () => {
    if (filters.grade === undefined) {
      filters.grade = -1;
      recognized.push("pre-K");
    }
  });
  consume(/\b(?:grade\s+)?(\d{1,2})(?:st|nd|rd|th)\s*grade\b|\bkindergarten\b/, (m) => {
    const g = m[0].includes("kindergarten") ? 0 : Number(m[1]);
    if (g >= 0 && g <= 12) {
      filters.grade = g;
      recognized.push(`grade ${g === 0 ? "K" : g}`);
    }
  });
  consume(/\bgrade\s+(\d{1,2})\b/, (m) => {
    const g = Number(m[1]);
    if (g >= 1 && g <= 12 && filters.grade === undefined) {
      filters.grade = g;
      recognized.push(`grade ${g}`);
    }
  });

  // 6. Sector
  consume(/\bcharter\b/, () => {
    filters.sectors = ["charter" as SchoolSector];
    recognized.push("charter");
  });
  consume(/\bpublic|district\b/, () => {
    filters.sectors = ["public" as SchoolSector];
    recognized.push("public");
  });
  consume(/\bprivate|parochial|independent\b/, () => {
    filters.sectors = ["private" as SchoolSector];
    recognized.push("private");
  });

  // 6b. Quality hint — ranking boost only, driven by real FL DOE grades
  consume(/\b(?:good|best|top[- ]?rated|highly[- ]?rated|a[- ]?rated|strong)\b/, () => {
    filters.preferStateGrade = true;
    recognized.push("top-rated (FL DOE grade)");
  });

  // 7. Programs
  for (const [re, label] of PROGRAM_PHRASES) {
    if (filters.program) break;
    consume(re, () => {
      filters.program = label;
      recognized.push(label);
    });
  }

  // 8. Size hints
  consume(/\b(?:under|fewer than|less than)\s+(\d[\d,]*)\s*students?\b/, (m) => {
    filters.maxEnrollment = Number(m[1].replace(/,/g, ""));
    recognized.push(`under ${filters.maxEnrollment} students`);
  });
  consume(/\b(?:over|more than|at least)\s+(\d[\d,]*)\s*students?\b/, (m) => {
    filters.minEnrollment = Number(m[1].replace(/,/g, ""));
    recognized.push(`over ${filters.minEnrollment} students`);
  });
  consume(/\bsmall|smaller\b/, () => {
    if (filters.maxEnrollment === undefined) {
      filters.maxEnrollment = 500;
      recognized.push("small school (≤500 students)");
    }
  });
  consume(/\blarge|big\b/, () => {
    if (filters.minEnrollment === undefined) {
      filters.minEnrollment = 1500;
      recognized.push("large school (≥1500 students)");
    }
  });

  // 9. Leftover → free text (drop stopwords); only keep if something real remains
  const leftover = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));
  if (leftover.length > 0) {
    filters.q = leftover.join(" ");
  }

  return {
    filters,
    recognized,
    ...(filters.q ? { freeText: filters.q } : {}),
  };
}
