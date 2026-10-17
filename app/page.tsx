import Link from "next/link";
import { getAllSchools, listCities } from "@/lib/data";
import { MatchBox } from "@/components/MatchBox";

export default function Home() {
  const schools = getAllSchools();
  const pub = schools.filter((s) => s.sector === "public").length;
  const charter = schools.filter((s) => s.sector === "charter").length;
  const priv = schools.filter((s) => s.sector === "private").length;
  const cities = listCities().length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Find the right school in Miami-Dade
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Search all {schools.length} public, charter, and private schools
          across {cities} municipalities — filter, map, and compare side by
          side.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-3xl">
        <MatchBox />
      </section>

      <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-link">{pub}</p>
          <p className="mt-1 text-sm text-muted-foreground">District public schools</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-link">{charter}</p>
          <p className="mt-1 text-sm text-muted-foreground">Charter schools</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-link">{priv}</p>
          <p className="mt-1 text-sm text-muted-foreground">Private schools</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-link">{cities}</p>
          <p className="mt-1 text-sm text-muted-foreground">Municipalities</p>
        </div>
      </section>

      <div className="mt-10 text-center">
        <Link
          href="/schools"
          className="rounded-md bg-primary px-6 py-3 font-medium text-white hover:bg-primary-hover"
        >
          Browse all schools →
        </Link>
      </div>
    </div>
  );
}
