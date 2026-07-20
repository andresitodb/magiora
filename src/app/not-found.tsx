import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] px-6 py-24 text-center">
      <p className="k-eyebrow mb-3">404</p>
      <h1 className="k-page-title">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md font-serif text-stone-600">
        This page may have moved, or it may no longer be public.
      </p>
      <Link href="/" className="k-button k-button-primary mt-8">
        Return home
      </Link>
    </main>
  );
}
