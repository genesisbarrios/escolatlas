import Link from "next/link";
import { ArrowRight, GraduationCap, Languages, MapPin } from "lucide-react";
import { getAllSchools } from "@/lib/data";

/** Project Miami-Dade lng/lat into a 600×280 schematic map crop. */
function toXY(lat: number, lng: number): { x: number; y: number } {
  const x = 20 + ((lng + 80.6) / 0.55) * 560;
  const y = 250 - ((lat - 25.4) / 0.65) * 230;
  return { x: Math.round(x), y: Math.round(y) };
}

export default function Home() {
  const schools = getAllSchools();
  const located = schools.filter((s) => s.lat !== null && s.lng !== null);
  const pins = located.slice(0, 90).map((s) => ({ id: s.id, ...toXY(s.lat!, s.lng!) }));

  return (
    <div className="flex flex-col">
      {/* ── Hero — matches the original landing: copy, prompt box, CTA, photo card ── */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <h1 className="font-heading text-4xl font-medium leading-[1.08] tracking-tight text-foreground md:text-6xl">
              Find your path to the right Miami-Dade school
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-foreground/85">
              Describe the school you want in your own words. Escolatlas turns
              it into visible filters on a map and shows where each fact comes
              from.
            </p>
            <Link
              href="/schools?mode=match"
              className="flex w-full max-w-prose items-center gap-3 rounded-xl border border-input bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPin className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 text-sm text-muted-foreground">
                Try: K-5 near Coral Gables with dual language
              </span>
            </Link>
            <Link
              href="/schools"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Start on the map <ArrowRight className="size-4" />
            </Link>
          </div>

          <figure className="flex min-w-0 flex-col gap-2">
            <img
              src="/assets/img/62e7742361a0-b3d34035c7.webp"
              alt="School courtyard in Coral Gables"
              className="w-full rounded-xl object-cover max-md:max-h-[55svh]"
            />
            <figcaption className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>
                Sample view · Source: Miami-Dade County GIS
              </span>
              <span className="chip chip-muted">Sample photo</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── "See your words become filters on the map" ── */}
      <section className="px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            See your words become filters on the map
          </h2>
          <div className="flex flex-wrap gap-2" aria-label="Filters from the sample prompt">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-input bg-card px-3 text-sm text-foreground/90">
              <GraduationCap className="size-4" /> Grades K–5
            </span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-input bg-card px-3 text-sm text-foreground/90">
              <MapPin className="size-4" /> Near Coral Gables
            </span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-input bg-card px-3 text-sm text-foreground/90">
              <Languages className="size-4" /> Dual language
            </span>
          </div>

          <div
            inert
            className="relative max-h-[420px] overflow-hidden rounded-xl border border-border bg-sunken"
          >
            <svg
              viewBox="0 0 600 280"
              className="hidden h-auto w-full md:block"
              role="img"
              aria-label="Sample map crop of school locations"
            >
              {Array.from({ length: 7 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  x2="600"
                  y1={40 * (i + 1)}
                  y2={40 * (i + 1)}
                  className="stroke-[var(--input)]"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
              {Array.from({ length: 11 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={54 * (i + 1)}
                  x2={54 * (i + 1)}
                  y1="0"
                  y2="280"
                  className="stroke-[var(--input)]"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
              {pins.map((p) => (
                <g key={p.id}>
                  <circle cx={p.x} cy={p.y} r="9" fill="var(--secondary)" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="var(--secondary-foreground)"
                  />
                </g>
              ))}
            </svg>
            <ul className="flex flex-col divide-y divide-border md:hidden">
              {located.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-start gap-3 p-3">
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-secondary" />
                  <span className="text-sm text-foreground/90">
                    {s.name} — {s.city}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-sunken to-transparent" />
          </div>
          <p className="text-xs text-muted-foreground">
            Sample view: {located.length} schools with real coordinates. Pins
            appear only where a location is known.
          </p>
        </div>
      </section>

      {/* ── Choose with confidence ── */}
      <section className="px-6 pb-16 pt-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Choose with confidence
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Start with the place your family calls home
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pan the map, or describe what you want, and see schools where
                they actually are.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Check each fact against its source
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every school lists the preferences it matches, plus its source
                and when it was last checked.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Compare up to four side by side
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep your priorities and the evidence in view, so you don&apos;t
                have to remember facts between pages.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
