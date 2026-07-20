'use client';

import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f5f3ee] px-6 py-24 text-center">
      <p className="k-eyebrow mb-3">Unable to load</p>
      <h1 className="k-page-title">Something interrupted this page</h1>
      <p className="mx-auto mt-4 max-w-md font-serif text-stone-600">
        Try loading it again. If the problem continues, return to the home page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="k-button k-button-primary">
          Try again
        </button>
        <Link href="/" className="k-button k-button-secondary">
          Return home
        </Link>
      </div>
    </main>
  );
}
