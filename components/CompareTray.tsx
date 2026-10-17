"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCompare, getCompareIds, subscribeCompare } from "@/lib/compare-store";

/** Fixed bottom bar showing the current compare selection. */
export function CompareTray() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getCompareIds());
    return subscribeCompare(() => setIds(getCompareIds()));
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {ids.length} school{ids.length === 1 ? "" : "s"} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
          <Link
            href={`/compare?ids=${ids.join(",")}`}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Compare side-by-side →
          </Link>
        </div>
      </div>
    </div>
  );
}
