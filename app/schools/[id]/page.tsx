import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool } from "@/lib/data";
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
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">
        {value ?? <span className="text-slate-400">Not reported</span>}
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/schools" className="text-sm text-blue-700 hover:underline">
        ← Back to results
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
          <p className="mt-1 text-slate-600">
            {school.address}
            {school.city ? `, ${school.city}` : ""} {school.zip}
          </p>
        </div>
        <CompareButton id={school.id} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
          {SECTOR_LABELS[school.sector]}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {LEVEL_LABELS[school.level]}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          Grades {formatGrades(school)}
        </span>
        {school.programs.map((p) => (
          <span
            key={p}
            className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <dl className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
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
                <a href={`tel:${school.phone}`} className="text-blue-700 hover:underline">
                  {school.phone}
                </a>
              ) : null
            }
          />
          <Row
            label="Email"
            value={
              school.email ? (
                <a href={`mailto:${school.email}`} className="text-blue-700 hover:underline">
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
                  className="text-blue-700 hover:underline"
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

        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          {school.lat !== null && school.lng !== null ? (
            <MapClient schools={[school]} selectedId={school.id} height={340} />
          ) : (
            <div className="flex h-[340px] items-center justify-center bg-slate-50 text-sm text-slate-500">
              Location not reported
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Source: Miami-Dade County GIS{" "}
        {school.source === "mdc-charter-schools" ? "charter school" : "public school"}{" "}
        layer · school #{school.sourceId}. Programs are inferred from the school
        name and may be incomplete — verify with the school.
      </p>

      <CompareTray />
    </div>
  );
}
