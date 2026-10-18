import Link from "next/link";
import { getSchool } from "@/lib/data";
import {
  LEVEL_LABELS,
  SECTOR_LABELS,
  formatGrades,
} from "@/lib/school";
import { COMPARE_LIMIT } from "@/lib/compare-store";
import { distanceMiles } from "@/lib/geo";
import { policeStationsNear, POLICE_NEARBY_MILES } from "@/lib/police";

export const metadata = { title: "Compare schools — Escolatlas" };

const NA = <span className="text-muted-foreground/70">Not reported</span>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.ids;
  const ids = (Array.isArray(raw) ? raw[0] : (raw ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, COMPARE_LIMIT);

  const schools = ids
    .map((id) => getSchool(id))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (schools.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Nothing to compare</h1>
        <p className="mt-2 text-muted-foreground">
          Pick schools with the “+ Compare” button, then come back.
        </p>
        <Link
          href="/schools"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Find schools →
        </Link>
      </div>
    );
  }

  const rows: {
    label: string;
    render: (s: (typeof schools)[number], i?: number) => React.ReactNode;
  }[] = [
    { label: "Type", render: (s) => SECTOR_LABELS[s.sector] },
    { label: "Level", render: (s) => LEVEL_LABELS[s.level] },
    { label: "Grades", render: (s) => formatGrades(s) },
    {
      label: "FL DOE grade",
      render: (s) =>
        s.stateGrade
          ? `${s.stateGrade}${s.stateGradeYear ? ` (${s.stateGradeYear})` : ""}`
          : NA,
    },
    {
      label: "Econ. disadvantaged",
      render: (s) =>
        s.econDisadvantagedPct !== null
          ? `${s.econDisadvantagedPct}% of students`
          : NA,
    },
    {
      label: "Year established",
      render: (s) => (s.yearEstablished !== null ? s.yearEstablished : NA),
    },
    {
      label: "Address",
      render: (s) => `${s.address}${s.city ? `, ${s.city}` : ""} ${s.zip}`.trim(),
    },
    {
      label: "Enrollment",
      render: (s) => (s.enrollment !== null ? s.enrollment.toLocaleString() : NA),
    },
    {
      label: "Capacity",
      render: (s) => (s.capacity !== null ? s.capacity.toLocaleString() : NA),
    },
    {
      label: "Utilization",
      render: (s) =>
        s.enrollment !== null && s.capacity
          ? `${Math.round((s.enrollment / s.capacity) * 100)}%`
          : NA,
    },
    {
      label: "Programs",
      render: (s) =>
        s.programs.length ? (
          s.programs.join(", ")
        ) : (
          <span className="text-muted-foreground/70">None listed</span>
        ),
    },
    {
      label: "Phone",
      render: (s) =>
        s.phone ? (
          <a href={`tel:${s.phone}`} className="text-link hover:underline">
            {s.phone}
          </a>
        ) : (
          NA
        ),
    },
    {
      label: "Website",
      render: (s) =>
        s.website ? (
          <a
            href={s.website}
            target="_blank"
            rel="noreferrer"
            className="text-link hover:underline"
          >
            Visit ↗
          </a>
        ) : (
          NA
        ),
    },
    {
      label: `Police stations ≤${POLICE_NEARBY_MILES} mi`,
      render: (s) =>
        s.lat !== null && s.lng !== null
          ? policeStationsNear(s.lat, s.lng).length
          : NA,
    },
    {
      label: "Distance between",
      render: (s, i) =>
        i === 0
          ? "—"
          : s.lat !== null &&
              schools[0].lat !== null &&
              s.lng !== null &&
              schools[0].lng !== null
            ? `${distanceMiles(s.lat, s.lng, schools[0].lat!, schools[0].lng!).toFixed(1)} mi from first`
            : NA,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/schools" className="text-sm text-link hover:underline">
        ← Back to results
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-foreground">
        Compare {schools.length} school{schools.length === 1 ? "" : "s"}
      </h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="w-40 p-3 text-left font-medium text-muted-foreground" />
              {schools.map((s) => (
                <th key={s.id} className="p-3 text-left align-top">
                  <Link
                    href={`/schools/${s.id}`}
                    className="font-semibold text-link hover:underline"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {s.city}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border last:border-0">
                <th className="p-3 text-left font-medium text-muted-foreground">
                  {r.label}
                </th>
                {schools.map((s, i) => (
                  <td key={s.id} className="p-3 align-top text-card-foreground">
                    {r.render(s, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
