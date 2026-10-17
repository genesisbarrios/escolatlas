import { test } from "node:test";
import assert from "node:assert/strict";
import { getAllSchools, getSchool, listCities } from "../lib/data.ts";

const schools = getAllSchools();

test("dataset is non-empty and ids are unique", () => {
  assert.ok(schools.length > 400);
  const ids = new Set(schools.map((s) => s.id));
  assert.equal(ids.size, schools.length);
});

test("every school has required fields and sane grades", () => {
  for (const s of schools) {
    assert.ok(s.name.length > 0, s.id);
    assert.ok(["public", "charter", "private"].includes(s.sector), s.id);
    assert.ok(s.gradeMin <= s.gradeMax, `${s.id} inverted span`);
    assert.ok(s.grades.length > 0, `${s.id} has no grades`);
  }
});

test("all coordinates are inside the Miami-Dade area", () => {
  for (const s of schools) {
    if (s.lat === null || s.lng === null) continue;
    assert.ok(s.lat > 24.3 && s.lat < 26.4, `${s.id} lat ${s.lat}`);
    assert.ok(s.lng > -81.2 && s.lng < -79.8, `${s.id} lng ${s.lng}`);
  }
});

test("missing fields are null, never undefined", () => {
  for (const s of schools) {
    for (const k of [
      "phone",
      "email",
      "website",
      "enrollment",
      "stateGrade",
      "econDisadvantagedPct",
      "yearEstablished",
      "coed",
    ] as const) {
      assert.notStrictEqual(s[k], undefined, `${s.id}.${k} is undefined`);
    }
  }
});

test("getSchool round-trips and 404s", () => {
  assert.equal(getSchool(schools[0].id)?.id, schools[0].id);
  assert.equal(getSchool("nope"), null);
});

test("cities list is sorted and non-empty", () => {
  const cities = listCities();
  assert.ok(cities.length > 10);
  assert.deepEqual(cities, [...cities].sort());
});
