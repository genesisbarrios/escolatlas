import Link from "next/link";
import { getAllSchools, listCities, listPrograms } from "@/lib/data";
import { applyFilters } from "@/lib/filters";
import { filtersFromParams } from "@/lib/query";
import { FilterBar } from "@/components/FilterBar";
import { MatchBox } from "@/components/MatchBox";
import { ResultsSection } from "@/components/ResultsSection";
import { CompareTray } from "@/components/CompareTray";

export const metadata = { title: "Find schools — Escolatlas" };

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = filtersFromParams(params);
  const results = applyFilters(getAllSchools(), filters);
  const hasFilters = Object.keys(filters).length > 0;

  const first = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">School finder</h1>

      <div className="mt-4">
        <MatchBox />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <FilterBar
          cities={listCities()}
          programs={listPrograms()}
          values={{
            q: first("q"),
            sector: first("sector"),
            level: first("level"),
            grade: first("grade"),
            city: first("city"),
            program: first("program"),
          }}
        />
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <strong>{results.length}</strong> school{results.length === 1 ? "" : "s"}
        {hasFilters ? " matching your filters" : ""}
      </p>

      <div className="mt-3">
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-700">No schools match</p>
            <p className="mt-1 text-sm text-slate-500">
              Try removing a filter or widening your search.
            </p>
            <Link
              href="/schools"
              className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <ResultsSection schools={results} />
        )}
      </div>

      <CompareTray />
    </div>
  );
}
