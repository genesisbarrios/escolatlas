"use client";

import { useState } from "react";
import type { School } from "@/lib/school";
import MapClient from "./MapClient";
import { SchoolCard } from "./SchoolCard";

/** Map + list driven by the same filtered set; hovering a card highlights its pin. */
export function ResultsSection({ schools }: { schools: School[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(380px,42%)]">
      <ul
        className="max-h-[560px] space-y-3 overflow-y-auto pr-1 lg:order-1"
        onMouseLeave={() => setHovered(null)}
      >
        {schools.map((s) => (
          <div key={s.id} onMouseEnter={() => setHovered(s.id)}>
            <SchoolCard school={s} />
          </div>
        ))}
      </ul>
      <div className="lg:order-2">
        <div className="lg:sticky lg:top-4 overflow-hidden rounded-lg border border-border shadow-sm">
          <MapClient schools={schools} selectedId={hovered} height={560} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {schools.filter((s) => s.lat !== null).length} pin
          {schools.length === 1 ? "" : "s"} on the map
        </p>
      </div>
    </div>
  );
}
