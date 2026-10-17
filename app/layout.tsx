import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escolatlas — Miami-Dade School Navigator",
  description:
    "Search, filter, map, and compare every public, charter, and private school in Miami-Dade County.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-[#1e3a8a] text-white">
          <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              Escolatlas
            </Link>
            <nav className="flex gap-5 text-sm">
              <Link href="/schools" className="hover:underline">
                Find schools
              </Link>
              <Link href="/schools?mode=match" className="hover:underline">
                Smart match
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Data: Miami-Dade County GIS open data (MDC.SchoolSite ·
          CharterSchool · PrivateSchool layers) and FL DOE accountability
          grades when available. Programs are inferred from school names only —
          always verify with the district or school.
        </footer>
      </body>
    </html>
  );
}
