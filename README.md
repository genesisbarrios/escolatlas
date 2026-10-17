# Escolatlas — Miami-Dade School Navigator
A hackathon MVP for the eMerge Americas Miami-Dade School Navigator challenge.
Escolatlas helps families find, filter, map, and compare every public and
charter school in Miami-Dade County — including a natural-language "smart
match" that turns plain-English preferences into ranked results with honest,
attribute-level explanations.

## Problem
Choosing a school in Miami-Dade means juggling scattered sources: district
directories, charter school lists, GIS maps, and word of mouth. There is no
single place to ask *"a charter elementary school near Doral"* and get a
defensible, transparent answer.

## Solution
One Next.js app — UI, API, and data in a single deployable unit:
- **Search & filter** — deterministic filters for school type (public /
  charter), level (elementary / middle / high / K-8 / K-12 / early),
  individual grade, city, zip, program, enrollment size, and radius.
- **Map + list** — every result set is a shared dataset: pins on a Leaflet
  map and the results list stay in sync; hovering a card highlights its pin.
- **Detail pages** — full record per school (grades, enrollment, capacity,
  contact info) with graceful "Not reported" for missing fields.
- **Compare** — pin up to 4 schools and view them side by side, including a
  computed utilization figure and distance between schools.
- **Smart match** — type a sentence; a deterministic parser extracts
  preferences, applies them as real filters, ranks candidates, and shows the
  user exactly which signals were understood.

## Architecture
```
app/                    Next.js App Router
  page.tsx              Landing (stats + smart match)
  schools/page.tsx      Finder (filter bar + map + list, server-rendered)
  schools/[id]/page.tsx School detail
  compare/page.tsx      Side-by-side comparison (?ids=a,b,c)
  api/schools/route.ts       GET filtered list
  api/schools/[id]/route.ts  GET one school (404 on miss)
  api/match/route.ts         GET ?q= / POST {query} → parsed filters + ranked results
lib/
  school.ts             Typed School model + labels
  data.ts               JSON loader (process-cached), city/zip centroids
  grades.ts             Grade-span parsing (PK=-1, K=0)
  filters.ts            Deterministic filter engine
  query.ts              URL params → SchoolFilters (shared API + pages)
  nlp.ts                Heuristic NL preference parser → SchoolFilters
  rank.ts               Deterministic scoring + attribute-only explanations
  geo.ts                Haversine distance
  compare-store.ts      localStorage compare list (client)
components/             React components (map, cards, filter bar, match box)
data/
  schools.json          539 normalized school records (generated)
  meta.json             Provenance: sources, fetch time, stats
scripts/fetch-schools.mjs  Ingestion: county ArcGIS → data/schools.json
tests/                  node:test suites (filters, ranking, NLP, data)
legacy/                 The previous Vite/Archie app, preserved untouched
```

## Data sources
Real Miami-Dade County GIS open data (no key required):

- `MDC.SchoolSite` — "Public School" feature layer (district facilities)
- `CharterSchool` — "Charter School" feature layer
- `PrivateSchool` — "Private School" feature layer (active schools only)

`npm run ingest` fetches all three layers and normalizes them into
`data/schools.json` (~1,500 schools after dropping administrative rows and
closed schools), recording provenance in `data/meta.json`. Rows missing
coordinates inside the Miami-Dade bounding box are nulled; enrollment of `0`
is treated as unreported.

### Optional: FL DOE school grades

`fldoe.org` blocks automated downloads. To enrich public/charter profiles with
the official accountability grade:

1. Open <https://www.fldoe.org/accountability/accountability-reporting/school-grades/>
   in a browser and download **School Grades (Excel)**.
2. Save it as `data/external/SchoolGrades25.xlsx` (or `school-grades.csv`
   with the same columns).
3. `npm run ingest` — the join uses the MDCPS school number, which both county
   layers already carry. "Top-rated" phrasing in smart match then boosts
   A/B/C-graded schools, and detail/compare show the grade.

### Honesty rules

`programs` is the only derived field and it is computed solely from each
school's **name** (e.g. "…STEM…", "Montessori", "Preparatory"). The API never
invents ratings, eligibility, addresses, programs, or availability — missing
source fields serialize as `null` and render as "Not reported."

## Smart match (AI usage)

`/api/match` uses a **deterministic heuristic parser** (`lib/nlp.ts`), not a
remote model — the hackathon environment has no AI provider configured, so the
feature works fully offline. It recognizes level phrases, grades, sectors,
programs, cities (longest-match wins, so "North Miami Beach" ≠ "North Miami"),
zip codes, size hints, and `within N miles of <place>` distance constraints.
Unrecognized text degrades to free-text search; malformed input returns all
schools rather than an error.

`parsePreference(text) → SchoolFilters` is the provider seam: to plug in an
LLM later, replace that one function body (e.g. Anthropic `ANTHROPIC_API_KEY`)
and validate the model's JSON output against the same `SchoolFilters` shape —
ranking and explanation generation stay unchanged.

## Setup

```bash
nvm use 22            # Node ≥ 22.18 required (tests use built-in TS type-stripping)
npm install
npm run dev           # http://localhost:3000
```

### Commands

| Command          | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | Dev server (port 3000)                          |
| `npm run build`  | Production build                                |
| `npm start`      | Serve the production build                      |
| `npm test`       | `node --test` — filters, ranking, NLP, data     |
| `npm run ingest` | Re-fetch county data → `data/schools.json`      |

### Environment variables

None required. The app is fully self-contained; map tiles come from public
CARTO/OpenStreetMap at runtime.

## Deployment

Any Node ≥ 22.18 host or serverless platform that runs `next start`
(Vercel, Netlify, a plain VM). Build with `npm run build`, serve with
`npm start`. Re-run `npm run ingest` at build time to refresh school data.

## Testing

`npm test` runs four `node:test` suites covering: filter correctness
(grade/sector/level/city/program/radius/missing fields), ranking determinism
and explanation honesty, the NL parser (including malformed input), and
dataset integrity (unique ids, coordinate bounds, null-not-undefined).

## Notes

- The earlier Archie-generated Vite app is preserved untouched under
  `legacy/` — it's a reference, not part of the build.
- Compare selections live in the browser (localStorage); no accounts, no
  backend state.
