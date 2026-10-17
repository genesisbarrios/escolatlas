import Link from "next/link";
import { getAllSchools, listCities, listPrograms } from "@/lib/data";
import { applyFilters } from "@/lib/filters";
import { filtersFromParams } from "@/lib/query";
import { runMatch } from "@/lib/match";
import { FilterBar } from "@/components/FilterBar";
import { MatchBox } from "@/components/MatchBox";
import { ResultsSection } from "@/components/ResultsSection";
import type { ResultEntry } from "@/components/ResultsSection";
import { CompareTray } from "@/components/CompareTray";

export const metadata = { title: "Find schools — Escolatlas" };

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = filtersFromParams(params);

  const first = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const mq = first("mq").trim();
  const match = mq ? await runMatch(mq) : null;
  const entries: ResultEntry[] = match
    ? match.results
    : applyFilters(getAllSchools(), filters).map((school) => ({ school }));
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">School finder</h1>

      <div className="mt-4">
        <MatchBox key={mq} initialQuery={mq} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <FilterBar
          key={JSON.stringify(params)}
          cities={listCities()}
          programs={listPrograms()}
          values={{
            q: first("q"),
            sector: first("sector"),
            level: first("level"),
            grade: first("grade"),
            city: first("city"),
            program: first("program"),
            stateGrade: first("stateGrade"),
          }}
        />
      </div>

      {match ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {match.recognized.length > 0 ? (
            <>
              Understood:{" "}
              {match.recognized.map((r, i) => (
                <span
                  key={i}
                  className="mr-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-link"
                >
                  {r}
                </span>
              ))}
            </>
          ) : (
            "No structured preferences recognized — showing all schools."
          )}{" "}
          <strong>{entries.length}</strong> match
          {entries.length === 1 ? "" : "es"} for &ldquo;{mq}&rdquo;
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <strong>{entries.length}</strong> school
          {entries.length === 1 ? "" : "s"}
          {hasFilters ? " matching your filters" : ""}
        </p>
      )}

      <div className="mt-3">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-input bg-card p-10 text-center">
            <p className="font-medium text-muted-foreground">No schools match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try removing a filter or widening your search.
            </p>
            <Link
              href="/schools"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <ResultsSection entries={entries} />
        )}
      </div>

      <CompareTray />
    </div>
  );
}
