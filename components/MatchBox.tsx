"use client";

import { useState } from "react";
import type { School } from "@/lib/school";
import { SchoolCard } from "./SchoolCard";

interface MatchResponse {
  query: string;
  recognized: string[];
  total: number;
  results: { school: School; score: number; reasons: string[] }[];
}

const EXAMPLES = [
  "charter elementary school in Doral",
  "public high school near Coral Gables",
  "small school with STEM within 5 miles of Miami Beach",
  "kindergarten charter in Hialeah",
];

export function MatchBox() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(q: string) {
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRes(await r.json());
    } catch {
      setError("Matching is unavailable right now — try the filters instead.");
      setRes(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) run(query.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Describe what you want — e.g. "charter elementary school in Doral"'
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Matching…" : "Match"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => run(ex)}
            className="text-blue-700 hover:underline"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {res && (
        <div className="mt-4">
          <p className="text-sm text-slate-600">
            {res.recognized.length > 0 ? (
              <>
                Understood:{" "}
                {res.recognized.map((r, i) => (
                  <span
                    key={i}
                    className="mr-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-blue-800"
                  >
                    {r}
                  </span>
                ))}
              </>
            ) : (
              "No structured preferences recognized — showing all schools."
            )}{" "}
            <strong>{res.total}</strong> match{res.total === 1 ? "" : "es"}
          </p>
          {res.results.length === 0 ? (
            <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              No schools match that description. Try widening the area or
              dropping a constraint.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {res.results.map((r) => (
                <SchoolCard
                  key={r.school.id}
                  school={r.school}
                  reasons={r.reasons}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
