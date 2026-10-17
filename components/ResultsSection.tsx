"use client";

import { useEffect, useState } from "react";
import type { School } from "@/lib/school";
import MapClient from "./MapClient";
import { SchoolCard } from "./SchoolCard";

export interface ResultEntry {
  school: School;
  reasons?: string[];
}

/** Map + list driven by the same filtered set; hovering a card highlights its
 *  pin, and clicking a pin scrolls to + highlights its card. */
export function ResultsSection({ entries }: { entries: ResultEntry[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const schools = entries.map((e) => e.school);

  useEffect(() => {
    if (!selected) return;
    document
      .querySelector(`[data-school-id="${CSS.escape(selected)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(380px,42%)]">
      <ul
        className="max-h-[560px] space-y-3 overflow-y-auto pr-1 lg:order-1"
        onMouseLeave={() => setHovered(null)}
      >
        {entries.map((e) => (
          <div
            key={e.school.id}
            onMouseEnter={() => setHovered(e.school.id)}
            className={`rounded-lg ${
              e.school.id === selected ? "ring-2 ring-primary" : ""
            }`}
          >
            <SchoolCard school={e.school} reasons={e.reasons} />
          </div>
        ))}
      </ul>
      <div className="lg:order-2">
        <div className="lg:sticky lg:top-4 overflow-hidden rounded-lg border border-border shadow-sm">
          <MapClient
            schools={schools}
            selectedId={hovered ?? selected}
            onSelect={setSelected}
            height={560}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {schools.filter((s) => s.lat !== null).length} pin
          {schools.length === 1 ? "" : "s"} on the map
        </p>
      </div>
    </div>
  );
}
