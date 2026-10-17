import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escolatlas — Miami-Dade School Navigator",
  description:
    "Search, filter, map, and compare every public, charter, and private school in Miami-Dade County.",
  icons: {
    icon: [
      { url: "/escolatlas-brand-assets/favicon/favicon.ico", sizes: "any" },
      { url: "/escolatlas-brand-assets/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/escolatlas-brand-assets/app-icon/apple-touch-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col">
        <header className="bg-chrome text-chrome-foreground border-b border-chrome-border">
          <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/escolatlas-brand-assets/logo/escolatlas-horizontal-white.svg"
                alt="Escolatlas"
                className="h-8 w-auto"
              />
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
