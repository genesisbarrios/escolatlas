import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFilters, parseGradeParam } from "../lib/filters.ts";
import type { School } from "../lib/school.ts";

function mk(partial: Partial<School>): School {
  return {
    id: "t-1",
    name: "Test School",
    sector: "public",
    siteType: "E",
    level: "elementary",
    grades: ["K", "1", "2", "3", "4", "5"],
    gradeMin: 0,
    gradeMax: 5,
    address: "1 Main St",
    city: "Miami",
    zip: "33101",
    lat: 25.77,
    lng: -80.19,
    phone: null,
    email: null,
    website: null,
    enrollment: 400,
    capacity: 500,
    region: "C",
    programs: [],
    stateGrade: null,
    stateGradeYear: null,
    econDisadvantagedPct: null,
    yearEstablished: null,
    coed: null,
    source: "mdc-public-schools",
    sourceId: "0000",
    ...partial,
  };
}

const schools: School[] = [
  mk({ id: "a", level: "elementary", gradeMin: 0, gradeMax: 5 }),
  mk({
    id: "b",
    level: "high",
    sector: "charter",
    gradeMin: 9,
    gradeMax: 12,
    grades: ["9", "10", "11", "12"],
    city: "Doral",
    programs: ["STEM"],
    enrollment: 1800,
    lat: 25.9,
    lng: -80.3,
  }),
  mk({
    id: "c",
    level: "early",
    gradeMin: -1,
    gradeMax: -1,
    grades: ["PK"],
    enrollment: null,
  }),
];

test("no filters returns everything", () => {
  assert.equal(applyFilters(schools, {}).length, 3);
});

test("sector filter", () => {
  const r = applyFilters(schools, { sectors: ["charter"] });
  assert.deepEqual(r.map((s) => s.id), ["b"]);
});

test("level filter", () => {
  const r = applyFilters(schools, { levels: ["high"] });
  assert.deepEqual(r.map((s) => s.id), ["b"]);
});

test("grade filter uses span inclusively", () => {
  assert.deepEqual(applyFilters(schools, { grade: 5 }).map((s) => s.id), ["a"]);
  assert.deepEqual(applyFilters(schools, { grade: -1 }).map((s) => s.id), ["c"]);
  assert.deepEqual(
    applyFilters(schools, { grade: 10 }).map((s) => s.id),
    ["b"],
  );
});

test("city filter is case-insensitive substring", () => {
  assert.deepEqual(applyFilters(schools, { city: "doral" }).map((s) => s.id), ["b"]);
  assert.deepEqual(applyFilters(schools, { city: "zzzz" }).length, 0);
});

test("program filter", () => {
  assert.deepEqual(applyFilters(schools, { program: "STEM" }).map((s) => s.id), ["b"]);
  assert.equal(applyFilters(schools, { program: "Montessori" }).length, 0);
});

test("radius filter", () => {
  // ~1mi from school a; b is in Doral (far)
  const r = applyFilters(schools, {
    within: { lat: 25.775, lng: -80.19, miles: 2 },
  });
  assert.deepEqual(r.map((s) => s.id).sort(), ["a", "c"]);
});

test("school missing coordinates is excluded from radius search", () => {
  const far = applyFilters(
    [mk({ id: "x", lat: null, lng: null })],
    { within: { lat: 25.77, lng: -80.19, miles: 50 } },
  );
  assert.equal(far.length, 0);
});

test("missing enrollment: maxEnrollment skips only when value exists", () => {
  const r = applyFilters(schools, { maxEnrollment: 500 });
  assert.deepEqual(r.map((s) => s.id).sort(), ["a", "c"]); // c has null enrollment → kept
});

test("empty result is a valid, empty list", () => {
  assert.deepEqual(applyFilters(schools, { city: "Nowhere" }), []);
});

test("parseGradeParam handles tokens and junk", () => {
  assert.equal(parseGradeParam("PK"), -1);
  assert.equal(parseGradeParam("k"), 0);
  assert.equal(parseGradeParam("5"), 5);
  assert.equal(parseGradeParam("13"), undefined);
  assert.equal(parseGradeParam("abc"), undefined);
  assert.equal(parseGradeParam(null), undefined);
});
