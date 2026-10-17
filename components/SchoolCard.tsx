import Link from "next/link";
import type { School } from "@/lib/school";
import { LEVEL_LABELS, SECTOR_LABELS, formatGrades } from "@/lib/school";
import { CompareButton } from "./CompareButton";

export function SchoolCard({
  school,
  reasons,
}: {
  school: School;
  reasons?: string[];
}) {
  return (
    <li
      data-school-id={school.id}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/schools/${school.id}`}
            className="font-semibold text-blue-800 hover:underline leading-snug"
          >
            {school.name}
          </Link>
          <p className="mt-0.5 text-sm text-slate-600">
            {school.address}
            {school.city ? `, ${school.city}` : ""} {school.zip}
          </p>
        </div>
        <CompareButton id={school.id} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
          {SECTOR_LABELS[school.sector]}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {LEVEL_LABELS[school.level]}
        </span>
        {school.stateGrade && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
            FL grade {school.stateGrade}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          Grades {formatGrades(school)}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {school.enrollment !== null
            ? `${school.enrollment.toLocaleString()} students`
            : "Enrollment n/a"}
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
      {reasons && reasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </li>
  );
}
