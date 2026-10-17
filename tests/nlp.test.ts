import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePreference } from "../lib/nlp.ts";
import type { GeoResolver } from "../lib/nlp.ts";

const GEO: GeoResolver = {
  cities: ["Miami", "Coral Gables", "Doral", "North Miami", "North Miami Beach", "Hialeah"],
  cityCentroid: (name) =>
    ["miami", "coral gables", "doral", "north miami", "north miami beach", "hialeah"].includes(
      name.toLowerCase(),
    )
      ? { lat: 25.77, lng: -80.19 }
      : null,
  zipCentroid: (zip) => (zip === "33156" ? { lat: 25.66, lng: -80.3 } : null),
};

test("parses sector + level + city", () => {
  const p = parsePreference("charter elementary school in Doral", GEO);
  assert.deepEqual(p.filters.sectors, ["charter"]);
  assert.ok(p.filters.levels?.includes("elementary"));
  assert.equal(p.filters.city, "Doral");
  assert.ok(p.recognized.length >= 3);
});

test("parses explicit grade", () => {
  const p = parsePreference("3rd grade public school", GEO);
  assert.equal(p.filters.grade, 3);
  assert.deepEqual(p.filters.sectors, ["public"]);
});

test("kindergarten maps to grade 0", () => {
  const p = parsePreference("kindergarten near Hialeah", GEO);
  assert.equal(p.filters.grade, 0);
  assert.equal(p.filters.city, "Hialeah");
});

test("pre-k maps to PK grade", () => {
  const p = parsePreference("pre-k program in Miami", GEO);
  assert.equal(p.filters.grade, -1);
});

test("longest city name wins", () => {
  const p = parsePreference("school in North Miami Beach", GEO);
  assert.equal(p.filters.city, "North Miami Beach");
});

test("distance phrase resolves to a point", () => {
  const p = parsePreference("schools within 5 miles of Coral Gables", GEO);
  assert.ok(p.filters.within);
  assert.equal(p.filters.within!.miles, 5);
});

test("distance phrase with zip", () => {
  const p = parsePreference("schools within 3 miles of 33156", GEO);
  assert.equal(p.filters.within?.miles, 3);
  assert.ok(Math.abs(p.filters.within!.lat - 25.66) < 0.01);
});

test("program keyword is extracted", () => {
  const p = parsePreference("a STEM middle school", GEO);
  assert.equal(p.filters.program, "STEM");
  assert.ok(p.filters.levels?.includes("middle"));
});

test("size hints become enrollment bounds", () => {
  const p = parsePreference("small elementary in Miami", GEO);
  assert.equal(p.filters.maxEnrollment, 500);
});

test("malformed input never throws and yields empty-ish filters", () => {
  for (const bad of ["", "   ", "!!!@@@###", "asdf qwer zxcv", null, undefined, 42]) {
    const p = parsePreference(bad as unknown as string, GEO);
    assert.ok(p.filters, `broke on ${JSON.stringify(bad)}`);
  }
  assert.deepEqual(parsePreference("", GEO).filters, {});
});

test("private sector is parsed", () => {
  const p = parsePreference("private school in Coral Gables", GEO);
  assert.deepEqual(p.filters.sectors, ["private"]);
  assert.equal(p.filters.city, "Coral Gables");
});

test("top-rated sets the quality hint, not a hard filter", () => {
  const p = parsePreference("best elementary school in Miami", GEO);
  assert.equal(p.filters.preferStateGrade, true);
  assert.ok(!("stateGrade" in p.filters)); // ranking hint only
});

test("garbage words become free text, not filters", () => {
  const p = parsePreference("wombat zucchini", GEO);
  assert.equal(p.filters.q, "wombat zucchini");
});
