"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [
  "charter elementary school in Doral",
  "public high school near Coral Gables",
  "small school with STEM within 5 miles of Miami Beach",
  "kindergarten charter in Hialeah",
];

export function MatchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  function run(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    router.push(`/schools?mq=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Smart match — describe the school you want
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
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
    </div>
  );
}
