import type { SchoolFilters } from "./school";

/**
 * LLM-backed natural-language preference parser.
 *
 * Uses Google Gemini (free tier — aistudio.google.com API key in
 * GEMINI_API_KEY). Returns null on any failure so callers fall back to the
 * deterministic heuristic parser. Output is strictly validated: only real
 * filter fields/values survive, so the LLM can't invent constraints.
 */
const VALID_SECTORS = new Set(["public", "charter", "private"]);
const VALID_LEVELS = new Set([
  "early", "elementary", "middle", "high", "k8", "k12", "secondary", "other",
]);

const PROMPT = `Convert this parent school-search request into a JSON filter object.
Schema (omit keys that aren't expressed):
{
  "q": string (leftover free text like a neighborhood or program keyword),
  "sector": "public"|"charter"|"private",
  "level": "early"|"elementary"|"middle"|"high"|"k8"|"k12"|"secondary",
  "grade": number 0-12 (single grade),
  
  "city": string, "zip": "33xxx",
  "program": string (e.g. "magnet","ib","dual language","montessori","stem","arts","sped","ell"),
  "minEnrollment": number, "maxEnrollment": number,
  "stateGrade": "A"|"B"|"C"|"D"|"F",
  "preferStateGrade": boolean (true when they say best/top-rated/highest),
  "near": { "place": string } (city/area name — resolves later),
  "recognized": string[] (short human labels of what you understood)
}
Rules: output JSON only. Never invent program names or constraints. If unsure, use "q".
Request: `;

export type ParsedPreferences = {
  filters: SchoolFilters;
  recognized: string[];
  parser: "llm";
};

export async function parseWithLLM(q: string): Promise<ParsedPreferences | null> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key || !q.trim()) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT + JSON.stringify(q) }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return validate(JSON.parse(text));
  } catch {
    return null;
  }
}

/** Keep only values that match the real filter schema — nothing invented. */
function validate(raw: Record<string, unknown>): ParsedPreferences {
  const f: SchoolFilters = {};
  if (typeof raw.q === "string" && raw.q.trim()) f.q = raw.q.trim();
  if (VALID_SECTORS.has(raw.sector as string))
    f.sectors = [raw.sector as NonNullable<SchoolFilters["sectors"]>[number]];
  if (VALID_LEVELS.has(raw.level as string))
    f.levels = [raw.level as NonNullable<SchoolFilters["levels"]>[number]];
  for (const k of ["grade", "minEnrollment", "maxEnrollment"] as const) {
    const v = Number(raw[k]);
    if (Number.isFinite(v) && v >= 0) f[k] = v;
  }
  if (typeof raw.city === "string") f.city = raw.city;
  if (typeof raw.zip === "string" && /^\d{5}$/.test(raw.zip)) f.zip = raw.zip;
  if (typeof raw.program === "string" && raw.program.trim()) f.program = raw.program.trim();
  if (typeof raw.stateGrade === "string" && /^[A-F]$/i.test(raw.stateGrade))
    f.stateGrade = raw.stateGrade.toUpperCase();
  if (raw.preferStateGrade === true) f.preferStateGrade = true;
  const near = raw.near as { place?: unknown; miles?: unknown } | undefined;
  if (near && typeof near.place === "string" && near.place.trim()) {
    (f as SchoolFilters & { __nearPlace?: string; __nearMiles?: number }).__nearPlace =
      near.place.trim();
    const m = Number(near.miles);
    if (Number.isFinite(m) && m > 0)
      (f as SchoolFilters & { __nearMiles?: number }).__nearMiles = m;
  }
  const recognized = Array.isArray(raw.recognized)
    ? raw.recognized.filter((r): r is string => typeof r === "string").slice(0, 12)
    : [];
  return { filters: f, recognized, parser: "llm" };
}
