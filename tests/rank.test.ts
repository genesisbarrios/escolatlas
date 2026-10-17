import { test } from "node:test";
import assert from "node:assert/strict";
import { rankSchools } from "../lib/rank.ts";
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

test("preferred attributes rank higher and produce reasons", () => {
  const a = mk({ id: "a", sector: "charter", city: "Doral" });
  const b = mk({ id: "b", sector: "public", city: "Hialeah" });
  const ranked = rankSchools([b, a], { sectors: ["charter"], city: "Doral" });
  assert.equal(ranked[0].school.id, "a");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].reasons.some((r) => r.includes("Charter")));
  assert.ok(ranked[0].reasons.some((r) => r.includes("Doral")));
});

test("grade mismatch is penalized", () => {
  const a = mk({ id: "a", gradeMin: 9, gradeMax: 12 });
  const b = mk({ id: "b", gradeMin: 0, gradeMax: 5 });
  const ranked = rankSchools([b, a], { grade: 10 });
  assert.equal(ranked[0].school.id, "a");
  assert.ok(ranked[1].score < 0);
});

test("reasons only reference real school attributes", () => {
  const s = mk({ id: "a", sector: "charter", programs: ["STEM"], enrollment: 300 });
  const [r] = rankSchools([s], {
    sectors: ["charter"],
    program: "STEM",
    maxEnrollment: 500,
  });
  for (const reason of r.reasons) {
    const mentionsProgram = s.programs.some((p) => reason.includes(p));
    const isKnown = /Charter|Public|students|mi away|Located|grade|Serves|Elementary|Middle|High/.test(
      reason,
    );
    assert.ok(mentionsProgram || isKnown, `invented reason: ${reason}`);
  }
});

test("preferStateGrade boosts real DOE grades without excluding ungraded", () => {
  const a = mk({ id: "a", stateGrade: "A", stateGradeYear: "2025-26" });
  const b = mk({ id: "b", stateGrade: "C", stateGradeYear: "2025-26" });
  const c = mk({ id: "c" }); // ungraded private, stays in the list
  const ranked = rankSchools([c, b, a], { preferStateGrade: true });
  assert.equal(ranked[0].school.id, "a");
  assert.ok(ranked[0].reasons.some((r) => r.includes("Graded A by FL DOE")));
  assert.equal(ranked.length, 3);
  assert.equal(ranked[2].school.id, "c");
});

test("deterministic order: equal scores sort by name", () => {
  const a = mk({ id: "a", name: "Beta" });
  const b = mk({ id: "b", name: "Alpha" });
  const ranked = rankSchools([a, b], {});
  assert.equal(ranked[0].school.name, "Alpha");
});
