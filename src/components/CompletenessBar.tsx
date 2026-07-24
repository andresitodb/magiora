import Link from 'next/link';
import type { DashboardCompleteness } from '@/lib/dashboardFoundation';

export default function CompletenessBar({
  completeness,
}: {
  completeness: DashboardCompleteness;
}) {
  const { percent, completed, total, missing } = completeness;

  return (
    <section className="rounded-md border border-stone-200 bg-stone-50/70 p-4 sm:p-5" aria-labelledby="profile-completeness-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="profile-completeness-title" className="k-eyebrow">PROFILE COMPLETENESS</h2>
          <p className="mt-1 text-sm text-stone-600">
            {completed} of {total} essential profile details complete.
          </p>
        </div>
        <span className="font-serif text-2xl font-medium text-[#712B13]" aria-hidden="true">
          {percent}%
        </span>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${completed} of ${total} profile details complete`}
      >
        <div className="h-full rounded-full bg-[#712B13]" style={{ width: `${percent}%` }} />
      </div>

      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-stone-800">What to complete next</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {missing.slice(0, 4).map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:border-[#712B13] hover:text-[#712B13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13]"
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-green-800">
          Your essential professional details are complete.
        </p>
      )}
    </section>
  );
}
