/** Grade-code normalization shared by ingestion, filtering, and the NLP parser. */

export const PK = -1;
export const K = 0;

/** "PK", "PreK", "PK3"/"PK4", "K"/"KG", "1".."12" → number. Returns null for junk. */
export function gradeTokenToNumber(token: string): number | null {
  const t = token.trim().toUpperCase();
  if (t === "" || t === "0") return null;
  if (/^(PRE-??K|PK\d?|VPK)$/.test(t)) return PK;
  if (/^KG?$/.test(t)) return K;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
  return null;
}

export function numberToGradeToken(n: number): string {
  if (n === PK) return "PK";
  if (n === K) return "K";
  return String(n);
}

/**
 * Parse source grade strings into an explicit grade set.
 * Handles "PK-5", "K", "9-12", "PreK-2", "PK6-12" (non-contiguous), "0"/"" (empty).
 */
export function parseGrades(raw: string | null | undefined): {
  grades: string[];
  gradeMin: number;
  gradeMax: number;
} {
  const s = (raw ?? "").trim().toUpperCase();
  if (s === "" || s === "0") return { grades: [], gradeMin: -1, gradeMax: -1 };

  const set = new Set<number>();
  for (const part of s.split(/[,\s]+/).filter(Boolean)) {
    // Non-contiguous form like "PK6-12": PK plus the 6-12 range.
    const pkLead = part.match(/^(PK|PRE-?K|VPK)(\d.*)$/);
    if (pkLead) {
      set.add(PK);
      for (const n of expandPart(pkLead[2])) set.add(n);
      continue;
    }
    for (const n of expandPart(part)) set.add(n);
  }

  const nums = [...set].sort((a, b) => a - b);
  return {
    grades: nums.map(numberToGradeToken),
    gradeMin: nums.length ? nums[0] : -1,
    gradeMax: nums.length ? nums[nums.length - 1] : -1,
  };
}

function expandPart(part: string): number[] {
  const range = part.match(/^([A-Z0-9]+)[-–]([A-Z0-9]+)$/);
  if (range) {
    const lo = gradeTokenToNumber(range[1]);
    const hi = gradeTokenToNumber(range[2]);
    if (lo !== null && hi !== null && hi >= lo) {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    }
    return [];
  }
  const single = gradeTokenToNumber(part);
  return single === null ? [] : [single];
}
