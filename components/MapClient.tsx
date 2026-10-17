"use client";

import dynamic from "next/dynamic";
import type { School } from "@/lib/school";

const SchoolMap = dynamic(() => import("./SchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function MapClient(props: {
  schools: School[];
  selectedId?: string | null;
  height?: number;
}) {
  return <SchoolMap {...props} />;
}
