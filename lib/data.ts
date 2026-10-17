import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { School } from "./school.ts";

let cache: School[] | null = null;

/** Loads data/schools.json once per process. Server-side only. */
export function getAllSchools(): School[] {
  if (cache === null) {
    const raw = readFileSync(join(process.cwd(), "data", "schools.json"), "utf8");
    cache = JSON.parse(raw) as School[];
  }
  return cache;
}

export function getSchool(id: string): School | null {
  return getAllSchools().find((s) => s.id === id) ?? null;
}

export function listCities(): string[] {
  const cities = new Set(getAllSchools().map((s) => s.city).filter(Boolean));
  return [...cities].sort();
}

export function listZips(): string[] {
  const zips = new Set(getAllSchools().map((s) => s.zip).filter(Boolean));
  return [...zips].sort();
}

export function listPrograms(): string[] {
  const all = new Set(getAllSchools().flatMap((s) => s.programs));
  return [...all].sort();
}

/** Centroid of a city's schools — used for "near <city>" queries. */
export function cityCentroid(city: string): { lat: number; lng: number } | null {
  const matches = getAllSchools().filter(
    (s) => s.city.toLowerCase() === city.toLowerCase() && s.lat !== null,
  );
  if (matches.length === 0) return null;
  const lat = matches.reduce((a, s) => a + s.lat!, 0) / matches.length;
  const lng = matches.reduce((a, s) => a + s.lng!, 0) / matches.length;
  return { lat, lng };
}

/** Centroid of a zip's schools — used for "within N miles of <zip>". */
export function zipCentroid(zip: string): { lat: number; lng: number } | null {
  const matches = getAllSchools().filter(
    (s) => s.zip === zip && s.lat !== null,
  );
  if (matches.length === 0) return null;
  const lat = matches.reduce((a, s) => a + s.lat!, 0) / matches.length;
  const lng = matches.reduce((a, s) => a + s.lng!, 0) / matches.length;
  return { lat, lng };
}
