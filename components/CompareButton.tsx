"use client";

import { useEffect, useState } from "react";
import {
  addToCompare,
  isInCompare,
  removeFromCompare,
  subscribeCompare,
} from "@/lib/compare-store";

export function CompareButton({ id }: { id: string }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(isInCompare(id));
    return subscribeCompare(() => setInList(isInCompare(id)));
  }, [id]);

  return (
    <button
      type="button"
      onClick={() => (inList ? removeFromCompare(id) : addToCompare(id))}
      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
        inList
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-ring"
      }`}
    >
      {inList ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}
