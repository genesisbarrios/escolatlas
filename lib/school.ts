/**
 * Escolatlas domain model — School.
 *
 * Every field maps to a real attribute in a public Miami-Dade dataset
 * (Miami-Dade County GIS: MDC.SchoolSite public-school layer and the
 * CharterSchool layer). Fields the sources do not provide are `null`,
 * never invented.
 */

export type SchoolSector = "public" | "charter" | "private";

/** Derived from the grade span a school serves. */
export type SchoolLevel =
  | "early" // PK only
  | "elementary"
  | "middle"
  | "high"
  | "k8" // spans elementary + middle (e.g. K-8 centers)
  | "k12" // spans most or all grades
  | "secondary" // combined middle+high (e.g. 6-12)
  | "other";

export interface School {
  /** Stable id: `pub-<siteId>` or `cht-<siteId>`. */
  id: string;
  name: string;
  sector: SchoolSector;
  /** Raw site-type code from the public layer (E/M/S/ALT/PLC/SPC/O/A/U), null for charters. */
  siteType: string | null;
  level: SchoolLevel;
  /** Expanded grade list, e.g. ["PK","K","1","2","3","4","5"]. Empty when the source is blank. */
  grades: string[];
  /** Numeric span for filtering. PK = -1, K = 0, 1..12. -1/-1 when unknown. */
  gradeMin: number;
  gradeMax: number;
  address: string;
  city: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  enrollment: number | null;
  capacity: number | null;
  /** MDCPS region code (N/C/S) — public layer only. */
  region: string | null;
  /** Program signals derived deterministically from the school's own name. */
  programs: string[];
  /** FL DOE accountability grade (A–F) — district + charter schools only. */
  stateGrade: string | null;
  /** School year the state grade covers, e.g. "2024-25". */
  stateGradeYear: string | null;
  /** FL DOE: % of students economically disadvantaged (district + charter). */
  econDisadvantagedPct: number | null;
  /** Year the school was established (private layer only). */
  yearEstablished: number | null;
  /** Co-educational flag (private layer only). */
  coed: boolean | null;
  source: "mdc-public-schools" | "mdc-charter-schools" | "mdc-private-schools";
  /** The source dataset's own school number. */
  sourceId: string;
}

export interface SchoolFilters {
  /** Free text over name / city / address. */
  q?: string;
  sectors?: SchoolSector[];
  levels?: SchoolLevel[];
  /** Serve a specific grade. PK=-1, K=0, 1..12. */
  grade?: number;
  /** City name, case-insensitive substring. */
  city?: string;
  zip?: string;
  /** Program keyword, matched against `programs`. */
  program?: string;
  minEnrollment?: number;
  maxEnrollment?: number;
  /** Radius filter — requires a reference point. */
  within?: { lat: number; lng: number; miles: number };
  /** FL DOE accountability letter grade (A–F) hard filter. */
  stateGrade?: string;
  /**
   * Ranking hint only (never excludes): boost schools with stronger FL DOE
   * accountability grades. Set by "good/best/top-rated" phrasing.
   */
  preferStateGrade?: boolean;
}

export const GRADE_LABELS: Record<number, string> = {
  [-1]: "PK",
  0: "K",
};

export function gradeLabel(g: number): string {
  return GRADE_LABELS[g] ?? String(g);
}

export function formatGrades(s: School): string {
  if (s.grades.length === 0) return "Grades not listed";
  if (s.gradeMin === s.gradeMax) return gradeLabel(s.gradeMin);
  return `${gradeLabel(s.gradeMin)}–${gradeLabel(s.gradeMax)}`;
}

export const LEVEL_LABELS: Record<SchoolLevel, string> = {
  early: "Early learning",
  elementary: "Elementary",
  middle: "Middle",
  high: "High",
  k8: "K-8",
  k12: "K-12",
  secondary: "Middle + high",
  other: "Other",
};

export const SECTOR_LABELS: Record<SchoolSector, string> = {
  public: "Public",
  charter: "Charter",
  private: "Private",
};
