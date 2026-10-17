/**
 * Fetches real Miami-Dade school records from the county's public ArcGIS
 * feature services and writes data/schools.json.
 *
 * Sources (Miami-Dade County GIS, https://gis-mdc.opendata.arcgis.com):
 *   - MDC.SchoolSite   — "Public School" layer (MDCPS district facilities)
 *   - CharterSchool    — "Charter School" layer
 *
 * Usage: npm run ingest
 *
 * No secrets required — both services are public. Only fields the source
 * actually provides are mapped; anything else is null (never invented).
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE =
  "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services";
const PUBLIC_URL = `${BASE}/SchoolSite_gdb/FeatureServer/0/query`;
const CHARTER_URL = `${BASE}/CharterSchool_gdb/FeatureServer/0/query`;
const PRIVATE_URL = `${BASE}/PrivateSchool_gdb/FeatureServer/0/query`;

const PK = -1;
const K = 0;

function gradeTokenToNumber(token) {
  const t = token.trim().toUpperCase();
  if (t === "" || t === "0") return null;
  if (/^(PRE-??K|PK\d?|VPK)$/.test(t)) return PK;
  if (/^KG?$/.test(t)) return K;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
  return null;
}

function numberToGradeToken(n) {
  if (n === PK) return "PK";
  if (n === K) return "K";
  return String(n);
}

function expandPart(part) {
  const range = part.match(/^([A-Z0-9]+)[-–]([A-Z0-9]+)$/);
  if (range) {
    const lo = gradeTokenToNumber(range[1]);
    const hi = gradeTokenToNumber(range[2]);
    if (lo !== null && hi !== null && hi >= lo) {
      const out = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    }
    return [];
  }
  const single = gradeTokenToNumber(part);
  return single === null ? [] : [single];
}

function parseGrades(raw) {
  const s = (raw ?? "").trim().toUpperCase();
  if (s === "" || s === "0") return { grades: [], gradeMin: -1, gradeMax: -1 };
  const set = new Set();
  for (const part of s.split(/[,\s]+/).filter(Boolean)) {
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

/**
 * Private-layer grade tokens are messier: "PK-KG", "KG-06", "05-K" (6mo→K),
 * "NS-PK" (nursery), "18-PK" (18mo→PK), "PK-0", "0-5" (0 = K), stray junk.
 */
function privateTokenToNumber(token) {
  const t = token.trim().toUpperCase();
  if (t === "") return null;
  if (/^(PRE-??K|PK\d?|VPK|NS|NURSERY|PG|PS|K4|PKG)$/.test(t)) return PK;
  if (/^(KG?|K5|0)$/.test(t)) return K;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
  return null;
}

function parsePrivateGrades(raw) {
  const s = String(raw ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .toUpperCase();
  if (s === "" || s === "0") return { grades: [], gradeMin: -1, gradeMax: -1 };
  const set = new Set();
  for (const part of s.split(/[,\s]+/).filter(Boolean)) {
    const range = part.match(/^([A-Z0-9.]+)[-–]([A-Z0-9.]+)$/);
    if (range) {
      let lo = privateTokenToNumber(range[1]);
      let hi = privateTokenToNumber(range[2]);
      if (lo === null && hi !== null) {
        set.add(hi); // "18-PK" = toddler→PK ≈ PK
        continue;
      }
      if (lo !== null && hi === null) {
        set.add(lo);
        continue;
      }
      if (lo !== null && hi !== null) {
        // "05-K" means 0.5yr (infant) → K, not grades 5→0
        if (lo === 5 && hi === K) lo = PK;
        if (lo > hi) [lo, hi] = [hi, lo];
        for (let i = lo; i <= hi; i++) set.add(i);
      }
      continue;
    }
    const single = privateTokenToNumber(part);
    if (single !== null) set.add(single);
  }
  const nums = [...set].sort((a, b) => a - b);
  return {
    grades: nums.map(numberToGradeToken),
    gradeMin: nums.length ? nums[0] : -1,
    gradeMax: nums.length ? nums[nums.length - 1] : -1,
  };
}

function deriveLevel(gradeMin, gradeMax) {
  if (gradeMax < 0) return "early";
  if (gradeMin >= 9) return "high";
  if (gradeMin >= 6) return gradeMax <= 9 ? "middle" : "secondary";
  if (gradeMax <= 5) return "elementary";
  if (gradeMax >= 9) return "k12";
  return "k8";
}

const PROGRAM_RULES = [
  [/\bS\.?T\.?E\.?A?M\.?\b|science|tech(nical|nology)?|engineering|robotics|coding|maritime/i, "STEM"],
  [/montessori/i, "Montessori"],
  [/art(s)?\b|music|band|theat(er|re)|drama|dance|performing/i, "Arts & music"],
  [/magnet/i, "Magnet"],
  [/international|baccalaureate|\bib\b|cambridge/i, "International studies"],
  [/dual language|bilingual|spanish/i, "Dual language"],
  [/vocational|career|technical/i, "Career & technical"],
  [/exceptional|special needs|special education/i, "Exceptional education"],
  [/adult|community school/i, "Adult & community"],
  [/preparatory|collegiate|college|\bprep\b/i, "College prep"],
];

function derivePrograms(name) {
  const out = new Set();
  for (const [re, label] of PROGRAM_RULES) if (re.test(name)) out.add(label);
  return [...out];
}

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function cleanCity(v) {
  const s = clean(v);
  if (s === null) return "";
  return s.replace(/miami[\s-]*i[\s-]*dade/i, "Miami-Dade");
}

function num(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function validLat(v) {
  const n = num(v);
  return n !== null && n >= 24.3 && n <= 26.4 ? n : null; // Miami-Dade bbox
}
function validLng(v) {
  const n = num(v);
  return n !== null && n >= -81.2 && n <= -79.8 ? n : null;
}

async function fetchAll(url, outFields) {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: outFields.join(","),
    returnGeometry: "false",
    resultRecordCount: "2000",
    f: "json",
  });
  const res = await fetch(`${url}?${params}`);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.features.map((f) => f.attributes);
}

function normalizePublic(a) {
  const { grades, gradeMin, gradeMax } = parseGrades(a.GRADES);
  // Administrative/adult rows carry blank or "0" grades — not family-facing schools.
  if (grades.length === 0) return null;
  return {
    id: `pub-${a.OBJECTID}`,
    name: clean(a.NAME) ?? "Unnamed school",
    sector: "public",
    siteType: clean(a.TYPE),
    level: deriveLevel(gradeMin, gradeMax),
    grades,
    gradeMin,
    gradeMax,
    address: clean(a.ADDRESS) ?? "",
    city: cleanCity(a.CITY),
    zip: a.ZIPCODE ? String(a.ZIPCODE) : "",
    lat: validLat(a.LAT),
    lng: validLng(a.LON),
    phone: clean(a.PHONE),
    email: clean(a.EMAIL),
    website: null, // public layer has no website field
    enrollment: num(a.ENROLLMNT) || null, // 0 = not reported
    capacity: num(a.CAPACITY) || null,
    region: clean(a.REGION),
    programs: derivePrograms(clean(a.NAME) ?? ""),
    stateGrade: null,
    stateGradeYear: null,
    econDisadvantagedPct: null,
    yearEstablished: null,
    coed: null,
    socials: {},
    source: "mdc-public-schools",
    sourceId: clean(a.ID) ?? String(a.OBJECTID),
  };
}

function normalizeCharter(a) {
  const { grades, gradeMin, gradeMax } = parseGrades(a.GRADE);
  if (grades.length === 0) return null;
  return {
    id: `cht-${a.OBJECTID}`,
    name: clean(a.NAME) ?? "Unnamed school",
    sector: "charter",
    siteType: null,
    level: deriveLevel(gradeMin, gradeMax),
    grades,
    gradeMin,
    gradeMax,
    address: clean(a.ADDRESS) ?? "",
    city: cleanCity(a.CITY),
    zip: a.ZIPCODE ? String(a.ZIPCODE) : "",
    lat: validLat(a.LAT),
    lng: validLng(a.LON),
    phone: clean(a.PHONE),
    email: clean(a.EMAIL),
    website: clean(a.WEBSITE),
    enrollment: num(a.ENROLLMNT) || null,
    capacity: num(a.CAPACITY) || null,
    region: null,
    programs: derivePrograms(clean(a.NAME) ?? ""),
    stateGrade: null,
    stateGradeYear: null,
    econDisadvantagedPct: null,
    yearEstablished: null,
    coed: null,
    socials: {},
    source: "mdc-charter-schools",
    sourceId: clean(a.ID) ?? String(a.OBJECTID),
  };
}

function normalizePrivate(a) {
  const status = (clean(a.STATUS) ?? "").toLowerCase();
  if (status === "closed") return null;
  const { grades, gradeMin, gradeMax } = parsePrivateGrades(a.GRDLEVEL);
  if (grades.length === 0) return null;
  const coedRaw = (clean(a.COED) ?? "").toUpperCase();
  return {
    id: `prv-${a.OBJECTID}`,
    name: clean(a.NAME) ?? "Unnamed school",
    sector: "private",
    siteType: clean(a.TYPE),
    level: deriveLevel(gradeMin, gradeMax),
    grades,
    gradeMin,
    gradeMax,
    address: clean(a.ADDRESS) ?? "",
    city: cleanCity(a.CITY),
    zip: a.ZIPCODE ? String(a.ZIPCODE) : "",
    lat: validLat(a.LAT),
    lng: validLng(a.LON),
    phone: clean(a.PHONE),
    email: clean(a.EMAIL),
    website: clean(a.WEBSITE),
    enrollment: num(a.ENROLLMENT) || null,
    capacity: null,
    region: null,
    programs: derivePrograms(clean(a.NAME) ?? ""),
    stateGrade: null, // FL DOE grades cover district + charter schools only
    stateGradeYear: null,
    econDisadvantagedPct: null,
    yearEstablished: num(a.YEARESTB),
    coed: coedRaw === "Y" ? true : coedRaw === "N" ? false : null,
    socials: {},
    source: "mdc-private-schools",
    sourceId: clean(a.GlobalID) ?? String(a.OBJECTID),
  };
}

/**
 * Optional enrichment: FL DOE School Grades workbook.
 * fldoe.org blocks automated downloads — drop the file into
 * data/external/ (e.g. SchoolGrades25.xlsx or school-grades.csv) and it is
 * merged on the next `npm run ingest`. Joins on the MDCPS school number,
 * which both county layers already carry as their ID field.
 */
async function loadStateGrades() {
  const dir = join(ROOT, "data", "external");
  const XLSX_FILES = [
    "SchoolGrades26.xlsx",
    "SchoolGrades25.xlsx",
    "SchoolGrades24.xlsx",
    "school-grades.xlsx",
  ];
  const hit = XLSX_FILES.find((f) => existsSync(join(dir, f)));
  const csvPath = join(dir, "school-grades.csv");
  const useCsv = !hit && existsSync(csvPath);
  if (!hit && !useCsv) return { grades: new Map(), year: null, file: null };

  const file = useCsv ? csvPath : join(dir, hit);
  let rows;
  if (useCsv) {
    const text = readFileSync(csvPath, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const header = lines[0].split(",").map((h) => h.trim());
    rows = lines.slice(1).map((l) => {
      const cells = l.split(",");
      return Object.fromEntries(header.map((h, i) => [h, cells[i]?.trim()]));
    });
  } else {
    const xlsxMod = await import("xlsx");
    const XLSX = xlsxMod.default ?? xlsxMod; // CJS interop
    const wb = XLSX.readFile(file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    // locate the header row: contains both a school-number and a grade column
    const headerIdx = grid.findIndex(
      (r) =>
        Array.isArray(r) &&
        r.some((c) => /school.*(number|no\.?|#)/i.test(String(c ?? ""))) &&
        r.some((c) => /^grade \d{4}$|^grade$/i.test(String(c ?? "").trim())),
    );
    if (headerIdx < 0) {
      console.warn("DOE workbook: header row not found — skipping enrichment");
      return { grades: new Map(), year: null, file };
    }
    const header = grid[headerIdx].map((h) => String(h ?? ""));
    rows = grid.slice(headerIdx + 1).map((cells) =>
      Object.fromEntries(header.map((h, i) => [h, cells[i] ?? null])),
    );
  }

  const findKey = (obj, re) => Object.keys(obj).find((k) => re.test(k));
  const sample = rows.find((r) => Object.values(r).some((v) => v !== null)) ?? {};
  const kDistrict = findKey(sample, /district/i);
  const kNumber = findKey(sample, /school.*(number|no\.?|#)/i);
  // prefer the newest "Grade YYYY" column; fall back to a bare "Grade"
  const gradeCols = Object.keys(sample).filter((k) =>
    /^grade \d{4}$/i.test(k.trim()),
  );
  const kGrade = gradeCols.length
    ? gradeCols.reduce((a, b) => (Number(a.slice(-4)) > Number(b.slice(-4)) ? a : b))
    : findKey(sample, /^grade$/i);
  const kEcon = findKey(sample, /economically disadvantaged/i);
  if (!kNumber || !kGrade) {
    console.warn("DOE workbook: school-number/grade columns not found");
    return { grades: new Map(), year: null, file };
  }

  const grades = new Map();
  for (const r of rows) {
    if (kDistrict && r[kDistrict] !== null) {
      const d = String(r[kDistrict]).toUpperCase();
      if (!/^(0?13|DADE|MIAMI-?DADE)/.test(d)) continue; // Miami-Dade = district 13
    }
    const num_ = String(r[kNumber] ?? "").replace(/\D/g, "");
    const g = String(r[kGrade] ?? "").trim().toUpperCase();
    const econ = kEcon ? num(r[kEcon]) : null;
    if (num_ && /^[A-F]$/.test(g)) grades.set(num_, { grade: g, econ });
  }

  // "Grade 2026" covers school year 2025-26; bare "Grade" → year unknown
  const ym = /^grade (\d{4})$/i.exec(kGrade.trim());
  const year = ym ? `${Number(ym[1]) - 1}-${ym[1].slice(2)}` : null;
  return { grades, year, file };
}

const publicRows = await fetchAll(PUBLIC_URL, [
  "OBJECTID", "ID", "NAME", "ADDRESS", "UNIT", "CITY", "ZIPCODE",
  "PHONE", "EMAIL", "TYPE", "GRADES", "CAPACITY", "ENROLLMNT",
  "REGION", "LAT", "LON",
]);
const charterRows = await fetchAll(CHARTER_URL, [
  "OBJECTID", "ID", "NAME", "ADDRESS", "UNIT", "CITY", "ZIPCODE",
  "PHONE", "EMAIL", "GRADE", "CAPACITY", "ENROLLMNT", "WEBSITE",
  "LAT", "LON",
]);
const privateRows = await fetchAll(PRIVATE_URL, [
  "OBJECTID", "GlobalID", "NAME", "ADDRESS", "UNIT", "CITY", "ZIPCODE",
  "PHONE", "EMAIL", "TYPE", "GRDLEVEL", "COED", "ENROLLMENT", "STATUS",
  "WEBSITE", "YEARESTB", "LAT", "LON",
]);

const schools = [
  ...publicRows.map(normalizePublic),
  ...charterRows.map(normalizeCharter),
  ...privateRows.map(normalizePrivate),
].filter(Boolean);

// FL DOE accountability grades — optional drop-in workbook, joined on the
// MDCPS school number both county layers already expose.
const { grades: stateGrades, year: stateYear, file: stateFile } =
  await loadStateGrades();
let graded = 0;
for (const s of schools) {
  if (s.sector === "private") continue;
  const hit2 = stateGrades.get(String(s.sourceId).replace(/\D/g, ""));
  if (hit2) {
    s.stateGrade = hit2.grade;
    s.stateGradeYear = stateYear;
    if (hit2.econ !== null) s.econDisadvantagedPct = hit2.econ;
    graded++;
  }
}
if (stateFile) console.log(`State grades merged from ${stateFile}: ${graded} schools`);


// Social links — scraped from each school's own homepage. Only links actually
// published on the site are captured; nothing is invented.
const SOCIAL_HOSTS = {
  "facebook.com": "facebook",
  "instagram.com": "instagram",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "youtube.com": "youtube",
};
async function scrapeSocials(school) {
  if (!school.website) return;
  try {
    const res = await fetch(school.website, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Escolatlas/1.0)" },
    });
    if (!res.ok) return;
    const html = await res.text();
    for (const [host, key] of Object.entries(SOCIAL_HOSTS)) {
      if (school.socials[key]) continue;
      const m = html.match(
        new RegExp(`https?:\\/\\/(?:www\\.)?${host.replace(".", "\\.")}\\/[A-Za-z0-9_.~%\\/?#-]{1,80}`, "i"),
      );
      if (m) school.socials[key] = m[0].replace(/[\)\]\'";]+$/, "");
    }
  } catch { /* unreachable site → no socials */ }
}

{
  const withSite = schools.filter((s) => s.website);
  const CONCURRENCY = 12;
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < withSite.length) await scrapeSocials(withSite[i++]);
    }),
  );
  const found = schools.filter((s) => Object.keys(s.socials).length).length;
  console.log(`Social links found for ${found} of ${withSite.length} school websites`);
  globalThis.__socialsFound = found;
}

const stats = {
  publicFetched: publicRows.length,
  charterFetched: charterRows.length,
  privateFetched: privateRows.length,
  kept: schools.length,
  droppedNoGrades:
    publicRows.length + charterRows.length + privateRows.length - schools.length,
  missingLatLng: schools.filter((s) => s.lat === null).length,
  stateGraded: graded,
  socialsFound: globalThis.__socialsFound ?? 0,
};

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(
  join(ROOT, "data", "schools.json"),
  JSON.stringify(schools, null, 2) + "\n",
);
writeFileSync(
  join(ROOT, "data", "meta.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sources: {
        "mdc-public-schools": PUBLIC_URL,
        "mdc-charter-schools": CHARTER_URL,
        "mdc-private-schools": PRIVATE_URL,
        "fl-doe-school-grades": stateFile
          ? `local file: ${stateFile}`
          : "not provided (drop SchoolGradesNN.xlsx in data/external/)",
      },
      stats,
    },
    null,
    2,
  ) + "\n",
);
console.log("Wrote", schools.length, "schools to data/schools.json");
console.log(stats);
