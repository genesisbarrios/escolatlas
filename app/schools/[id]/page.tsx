import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool, getTractDemographics } from "@/lib/data";
import { policeStationsNear, POLICE_NEARBY_MILES } from "@/lib/police";
import {
  LEVEL_LABELS,
  SECTOR_LABELS,
  formatGrades,
} from "@/lib/school";
import MapClient from "@/components/MapClient";
import { CompareButton } from "@/components/CompareButton";
import { CompareTray } from "@/components/CompareTray";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-card-foreground">
        {value ?? <span className="text-muted-foreground/70">Not reported</span>}
      </dd>
    </div>
  );
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = getSchool(id);
  if (!school) notFound();

  const demo = getTractDemographics(school.tractGeoId);
  const nearStations =
    school.lat !== null && school.lng !== null
      ? policeStationsNear(school.lat, school.lng)
      : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/schools" className="text-sm text-link hover:underline">
        ← Back to results
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{school.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {school.address}
            {school.city ? `, ${school.city}` : ""} {school.zip}
          </p>
        </div>
        <CompareButton id={school.id} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="chip chip-primary">
          {SECTOR_LABELS[school.sector]}
        </span>
        <span className="chip chip-muted">
          {LEVEL_LABELS[school.level]}
        </span>
        <span className="chip chip-muted">
          Grades {formatGrades(school)}
        </span>
        {school.programs.map((p) => (
          <span
            key={p}
            className="chip chip-success"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
        <dl className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            School facts
          </h2>
          <Row label="Grades served" value={formatGrades(school)} />
          <Row
            label="FL DOE grade"
            value={
              school.stateGrade
                ? `${school.stateGrade}${school.stateGradeYear ? ` (${school.stateGradeYear})` : ""}`
                : null
            }
          />
          <Row
            label="Enrollment"
            value={
              school.enrollment !== null
                ? `${school.enrollment.toLocaleString()} students`
                : null
            }
          />
          <Row
            label="Capacity"
            value={
              school.capacity !== null
                ? school.capacity.toLocaleString()
                : null
            }
          />
          <Row
            label="Phone"
            value={
              school.phone ? (
                <a href={`tel:${school.phone}`} className="text-link hover:underline">
                  {school.phone}
                </a>
              ) : null
            }
          />
          <Row
            label="Email"
            value={
              school.email ? (
                <a href={`mailto:${school.email}`} className="text-link hover:underline">
                  {school.email}
                </a>
              ) : null
            }
          />
          <Row
            label="Website"
            value={
              school.website ? (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link hover:underline"
                >
                  Visit site ↗
                </a>
              ) : null
            }
          />
          <Row
            label="Economically disadvantaged"
            value={
              school.econDisadvantagedPct !== null
                ? `${school.econDisadvantagedPct}% of students`
                : null
            }
          />
          <Row
            label="Social"
            value={
              Object.keys(school.socials ?? {}).length ? (
                <span className="flex justify-end gap-2">
                  {Object.entries(school.socials ?? {}).map(([k, url]) => (
                    <a key={k} href={url} target="_blank" rel="noreferrer"
                       className="text-link hover:underline capitalize">{k}</a>
                  ))}
                </span>
              ) : null
            }
          />
          <Row
            label="MDCPS region"
            value={school.region ?? null}
          />
          <Row
            label="Year established"
            value={school.yearEstablished ?? null}
          />
          <Row
            label="Co-educational"
            value={
              school.coed === null
                ? null
                : school.coed
                  ? "Yes"
                  : "No (single gender)"
            }
          />
        </dl>

        <dl className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Neighborhood
            {demo?.name ? ` — ${demo.name}` : ""}
          </h2>
          {demo ? (
            <>
              <Row
                label="Population"
                value={
                  demo.population !== null
                    ? demo.population.toLocaleString()
                    : null
                }
              />
              <Row
                label="Median household income"
                value={
                  demo.medianHouseholdIncome !== null
                    ? `$${demo.medianHouseholdIncome.toLocaleString()}`
                    : null
                }
              />
              <Row
                label="Below poverty line"
                value={
                  demo.povertyRate !== null
                    ? `${Math.round(demo.povertyRate * 100)}%`
                    : null
                }
              />
              <Row
                label="Bachelor's degree or higher"
                value={
                  demo.bachelorsPlusRate !== null
                    ? `${Math.round(demo.bachelorsPlusRate * 100)}% of adults 25+`
                    : null
                }
              />
              <p className="mt-3 text-xs text-muted-foreground/70">
                Census tract where the school sits — ACS 5-year estimates via
                Census Reporter. Describes the tract, not the school's students.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No census tract data for this location.
            </p>
          )}
        </dl>
        </div>

        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-lg border border-border shadow-sm">
            {school.lat !== null && school.lng !== null ? (
              <MapClient
                schools={[school]}
                stations={nearStations.map((d) => d.station)}
                selectedId={school.id}
                height={340}
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center bg-muted text-sm text-muted-foreground">
                Location not reported
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              🚓 Police stations within {POLICE_NEARBY_MILES} miles
            </h2>
            {nearStations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {school.lat === null
                  ? "School location not reported — can't measure distances."
                  : `No police stations within ${POLICE_NEARBY_MILES} miles.`}
              </p>
            ) : (
              <ul className="space-y-2.5">
                <li className="border-b border-border pb-2.5 text-sm">
                  <span className="font-medium">{school.name}</span>
                  <span className="text-muted-foreground"> — reference point</span>
                </li>
                {nearStations.map(({ station, distance }) => (
                  <li key={station.id} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-card-foreground">
                        {station.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {station.address}
                        {station.city ? `, ${station.city}` : ""} ·{" "}
                        {station.agency === "county"
                          ? "Miami-Dade Sheriff"
                          : (station.jurisdiction ?? "Municipal police")}
                        {station.phone ? ` · ${station.phone}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {distance.toFixed(1)} mi
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        Source: Miami-Dade County GIS{" "}
        {school.source === "mdc-charter-schools"
          ? "charter school"
          : school.source === "mdc-private-schools"
            ? "private school"
            : "public school"}{" "}
        layer · school #{school.sourceId}. Programs are inferred from the school
        name and may be incomplete — verify with the school.
      </p>

      <CompareTray />
    </div>
  );
}
