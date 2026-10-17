"use client";

import { useEffect, useRef, useState } from "react";
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

export function MatchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
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

  const ran = useRef(false);
  useEffect(() => {
    if (!ran.current && initialQuery.trim()) {
      ran.current = true;
      run(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Matching…" : "Match"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => run(ex)}
            className="text-link hover:underline"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {res && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {res.recognized.length > 0 ? (
              <>
                Understood:{" "}
                {res.recognized.map((r, i) => (
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
            <strong>{res.total}</strong> match{res.total === 1 ? "" : "es"}
          </p>
          {res.results.length === 0 ? (
            <p className="mt-3 rounded-md bg-[var(--status-warning-bg)] p-3 text-sm text-[var(--status-warning-ink)]">
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
