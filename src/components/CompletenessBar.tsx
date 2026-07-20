import Link from 'next/link';
import {
  computeCompleteness,
  type ProfileCompletenessData,
} from '@/lib/profileCompleteness';

export default function CompletenessBar({
  profile,
}: {
  profile: ProfileCompletenessData;
}) {
  const { percent, missing } = computeCompleteness(profile);

  if (percent === 100) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-medium text-green-700">100%</span>
          <p className="font-serif text-sm text-green-900">
            Profile complete. 🎉
          </p>
        </div>
      </div>
    );
  }

  // Show only the top 1 missing item — keep it compact
  const topMissing = missing[0];

  return (
    <div className="bg-white border border-stone-200 rounded-md px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-serif text-xl font-medium text-[#712B13]">{percent}%</span>
          <p className="font-serif text-sm text-stone-700 truncate">
            {percent < 40 && 'Just getting started'}
            {percent >= 40 && percent < 70 && 'Looking good'}
            {percent >= 70 && percent < 100 && 'Almost there'}
          </p>
        </div>
        <Link
          href="/dashboard/profile"
          className="text-xs italic font-serif text-[#712B13] hover:underline whitespace-nowrap"
        >
          Edit →
        </Link>
      </div>

      <div className="relative h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2">
        <div
          className="absolute inset-y-0 left-0 bg-[#712B13] rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {topMissing && (
        <p className="text-xs italic text-stone-500 font-serif">
          Next: <span className="not-italic">{topMissing}</span>
        </p>
      )}
    </div>
  );
}
