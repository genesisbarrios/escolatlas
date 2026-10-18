import { readFileSync } from "node:fs";
import { join } from "node:path";
import { distanceMiles } from "./geo.ts";

/**
 * Police stations from Miami-Dade County GIS (county MDSO + municipal layers).
 * Snapshot written by npm run ingest → data/police-stations.json.
 */
export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string | null;
  lat: number;
  lng: number;
  agency: "county" | "municipal";
  /** Municipal jurisdiction name (e.g. "Miami"), null for county stations. */
  jurisdiction: string | null;
}

/** Radius used for "nearby police stations" in lists and compare counts. */
export const POLICE_NEARBY_MILES = 10;

let cache: PoliceStation[] | null = null;

export function getPoliceStations(): PoliceStation[] {
  if (cache === null) {
    const raw = readFileSync(
      join(process.cwd(), "data", "police-stations.json"),
      "utf8",
    );
    cache = JSON.parse(raw) as PoliceStation[];
  }
  return cache;
}

export interface StationDistance {
  station: PoliceStation;
  distance: number;
}

/** Stations within `miles` of a point, nearest first. */
export function policeStationsNear(
  lat: number,
  lng: number,
  miles: number = POLICE_NEARBY_MILES,
): StationDistance[] {
  return getPoliceStations()
    .map((station) => ({
      station,
      distance: distanceMiles(lat, lng, station.lat, station.lng),
    }))
    .filter((d) => d.distance <= miles)
    .sort((a, b) => a.distance - b.distance);
}
