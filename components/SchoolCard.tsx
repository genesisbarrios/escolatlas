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
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/schools/${school.id}`}
            className="font-semibold text-link hover:underline leading-snug"
          >
            {school.name}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {school.address}
            {school.city ? `, ${school.city}` : ""} {school.zip}
          </p>
        </div>
        <CompareButton id={school.id} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="chip chip-primary">
          {SECTOR_LABELS[school.sector]}
        </span>
        <span className="chip chip-muted">
          {LEVEL_LABELS[school.level]}
        </span>
        {school.stateGrade && (
          <span className="chip chip-warn">
            FL grade {school.stateGrade}
          </span>
        )}
        <span className="chip chip-muted">
          Grades {formatGrades(school)}
        </span>
        <span className="chip chip-muted">
          {school.enrollment !== null
            ? `${school.enrollment.toLocaleString()} students`
            : "Enrollment n/a"}
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
      {reasons && reasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </li>
  );
}
