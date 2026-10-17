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
          ? "border-blue-700 bg-blue-700 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
      }`}
    >
      {inList ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}
