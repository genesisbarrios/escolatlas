"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEVEL_LABELS, SECTOR_LABELS } from "@/lib/school";
import type { SchoolLevel, SchoolSector } from "@/lib/school";

const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: "-1", label: "Pre-K" },
  { value: "0", label: "K" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
];

export function FilterBar({
  cities,
  programs,
  values,
}: {
  cities: string[];
  programs: string[];
  values: {
    q: string;
    sector: string;
    level: string;
    grade: string;
    city: string;
    program: string;
    stateGrade: string;
  };
}) {
  const router = useRouter();
  const [v, setV] = useState(values);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val) params.set(k, val);
    router.push(`/schools?${params}`);
  }

  const inputCls =
    "w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm";

  return (
    <form onSubmit={submit}>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Keyword — name, address, or zip
        </span>
        <input
          className={`${inputCls} mt-1`}
          placeholder="Search by name or address…"
          value={v.q}
          onChange={set("q")}
          name="q"
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <select className={inputCls} value={v.sector} onChange={set("sector")} name="sector" aria-label="School type">
        <option value="">All types</option>
        {(Object.keys(SECTOR_LABELS) as SchoolSector[]).map((s) => (
          <option key={s} value={s}>
            {SECTOR_LABELS[s]}
          </option>
        ))}
      </select>
      <select className={inputCls} value={v.level} onChange={set("level")} name="level" aria-label="School level">
        <option value="">All levels</option>
        {(Object.keys(LEVEL_LABELS) as SchoolLevel[]).map((l) => (
          <option key={l} value={l}>
            {LEVEL_LABELS[l]}
          </option>
        ))}
      </select>
      <select className={inputCls} value={v.grade} onChange={set("grade")} name="grade" aria-label="Grade">
        <option value="">Any grade</option>
        {GRADE_OPTIONS.map((g) => (
          <option key={g.value} value={g.value}>
            Grade {g.label}
          </option>
        ))}
      </select>
      <select className={inputCls} value={v.city} onChange={set("city")} name="city" aria-label="City">
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className={inputCls}
        value={v.program}
        onChange={set("program")}
        name="program"
        aria-label="Program"
      >
        <option value="">Any program</option>
        {programs.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        className={inputCls}
        value={v.stateGrade}
        onChange={set("stateGrade")}
        name="stateGrade"
        aria-label="FL DOE grade"
      >
        <option value="">Any FL grade</option>
        {["A", "B", "C", "D", "F"].map((g) => (
          <option key={g} value={g}>
            FL Grade {g}
          </option>
        ))}
      </select>
      <div className="col-span-2 flex gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setV({ q: "", sector: "", level: "", grade: "", city: "", program: "", stateGrade: "" });
            router.push("/schools");
          }}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          Clear
        </button>
      </div>
      </div>
    </form>
  );
}
