import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page or school you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/schools"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Back to school finder →
      </Link>
    </div>
  );
}
