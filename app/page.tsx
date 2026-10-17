import Link from "next/link";
import { ArrowRight, GraduationCap, Languages, MapPin, Search } from "lucide-react";
import { getAllSchools } from "@/lib/data.ts";
import MapClient from "@/components/MapClient";

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
    <div className="flex flex-col bg-[var(--ink)] text-[#f4f8fc]">
      {/* ── Hero — matches the original landing: copy, prompt box, CTA, photo card ── */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <h1 className="font-heading text-4xl font-medium leading-[1.08] tracking-tight text-foreground md:text-6xl">
              Find your path to the right Miami-Dade school
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-[#f4f8fc]/85">
              Describe the school you want in your own words. Escolatlas turns
              it into visible filters on a map and shows where each fact comes
              from.
            </p>
            <form
              action="/schools"
              className="flex w-full max-w-prose items-center gap-3 rounded-xl border border-[var(--ink-soft)] bg-[var(--ink-soft)] p-4 text-left focus-within:ring-2 focus-within:ring-ring"
            >
              <MapPin className="size-5 shrink-0 text-[#f4f8fc]/60" />
              <input
                type="search"
                name="mq"
                placeholder="Try: K-5 near Coral Gables with dual language"
                aria-label="Describe the school you want"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#f4f8fc] placeholder:text-[#f4f8fc]/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search schools"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                <Search className="size-4" />
                Search
              </button>
            </form>
            <Link
              href="/schools"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Start on the map <ArrowRight className="size-4" />
            </Link>
          </div>

          <figure className="flex min-w-0 flex-col gap-2">
            <img
              src="/assets/img/miami-senior-high.jpg"
              alt="Miami Senior High School"
              className="w-full rounded-xl object-cover max-md:max-h-[55svh]"
            />
            <figcaption className="text-xs font-medium text-[#f4f8fc]/60">
              Miami Senior High School · Source: Wikimedia Commons
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── "See your words become filters on the map" ── */}
      <section className="bg-[#2c5283] px-6 py-12 text-[#f4f8fc]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <h2 className="font-heading text-2xl font-semibold text-[#f4f8fc]">
            See your words become filters on the map
          </h2>
          <div className="flex flex-wrap gap-2" aria-label="Filters from the sample prompt">
            <Link href="/schools?level=elementary" className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-[#f4f8fc]/90 hover:bg-white/20">
              <GraduationCap className="size-4" /> Grades K–5
            </Link>
            <Link href="/schools?city=Coral%20Gables" className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-[#f4f8fc]/90 hover:bg-white/20">
              <MapPin className="size-4" /> Near Coral Gables
            </Link>
            <Link href="/schools?program=Dual%20language" className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-[#f4f8fc]/90 hover:bg-white/20">
              <Languages className="size-4" /> Dual language
            </Link>
          </div>

          <div className="relative max-h-[420px] overflow-hidden rounded-xl border border-[var(--ink-soft)]">
            <MapClient schools={located} height={420} />
            <Link
              href="/schools"
              aria-label="Open the interactive school map"
              className="absolute inset-0 z-[500] flex items-end justify-center pb-3 bg-gradient-to-t from-[#14263d]/70 via-transparent to-transparent"
            >
              <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                Open the interactive map →
              </span>
            </Link>
          </div>
          <p className="text-xs text-[#f4f8fc]/60">
            Sample view: {located.length} schools with real coordinates. Pins
            appear only where a location is known.
          </p>
        </div>
      </section>

      {/* ── Choose with confidence ── */}
      <section className="px-6 pb-16 pt-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold text-[#f4f8fc]">
            Choose with confidence
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--ink-soft)] bg-[var(--ink-soft)] p-5">
              <h3 className="font-heading text-base font-semibold text-[#f4f8fc]">
                Start with the place your family calls home
              </h3>
              <p className="mt-2 text-sm text-[#f4f8fc]/60">
                Pan the map, or describe what you want, and see schools where
                they actually are.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--ink-soft)] bg-[var(--ink-soft)] p-5">
              <h3 className="font-heading text-base font-semibold text-[#f4f8fc]">
                Check each fact against its source
              </h3>
              <p className="mt-2 text-sm text-[#f4f8fc]/60">
                Every school lists the preferences it matches, plus its source
                and when it was last checked.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--ink-soft)] bg-[var(--ink-soft)] p-5">
              <h3 className="font-heading text-base font-semibold text-[#f4f8fc]">
                Compare up to four side by side
              </h3>
              <p className="mt-2 text-sm text-[#f4f8fc]/60">
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
