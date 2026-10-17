import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escolatlas — Miami-Dade School Navigator",
  description:
    "Search, filter, map, and compare every public, charter, and private school in Miami-Dade County.",
  icons: { icon: "/assets/brand/e9d462ff59.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-chrome text-chrome-foreground border-b border-chrome-border">
          <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-heading font-semibold text-lg tracking-tight"
            >
              <img
                src="/assets/brand/e9d462ff59.svg"
                alt="Escolatlas"
                className="h-7 w-7 rounded"
              />
              Escolatlas
            </Link>
            <nav className="flex gap-5 text-sm text-muted-foreground">
              <Link href="/schools" className="hover:text-link hover:underline">
                Find schools
              </Link>
              <Link
                href="/schools?mode=match"
                className="hover:text-link hover:underline"
              >
                Smart match
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          Data: Miami-Dade County GIS open data (MDC.SchoolSite ·
          CharterSchool · PrivateSchool layers) and FL DOE accountability
          grades when available. Programs are inferred from school names only —
          always verify with the district or school.
        </footer>
      </body>
    </html>
  );
}
