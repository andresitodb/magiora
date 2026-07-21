import Link from 'next/link';
import Nav from '@/components/Nav';

export default function CastingAccessGate({ nextPath = '/casting-calls' }: { nextPath?: string }) {
  return (
    <div className="min-h-screen bg-[var(--magiora-bg)]">
      <Nav />
      <main className="k-container k-section max-w-3xl">
        <section className="k-card bg-white px-6 py-12 text-center md:px-12 md:py-16">
          <p className="k-eyebrow mb-3">Now casting</p>
          <h1 className="k-page-title">Casting Calls</h1>
          <p className="k-body-muted mx-auto mt-4 max-w-xl text-base md:text-lg">
            Join Magiora to discover verified casting opportunities.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <p className="font-serif text-sm text-stone-500">Create a free account to:</p>
            <ul className="mt-3 space-y-2 font-serif text-stone-700">
              <li>Browse open productions</li>
              <li>Apply directly</li>
              <li>Receive relevant matches</li>
            </ul>
          </div>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="k-button k-button-primary w-full sm:w-auto">
              Create free account
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="k-editorial-link font-serif text-sm italic"
            >
              Sign in →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
