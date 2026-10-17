"use client";

import dynamic from "next/dynamic";
import type { School } from "@/lib/school";

const SchoolMap = dynamic(() => import("./SchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export default function MapClient(props: {
  schools: School[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  return <SchoolMap {...props} />;
}
