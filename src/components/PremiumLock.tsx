import Link from 'next/link';

export default function PremiumLock({
  isMember,
  feature,
  children,
}: {
  isMember: boolean;
  feature: string;
  children: React.ReactNode;
}) {
  if (isMember) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#f5f3ee]/70 backdrop-blur-[1px] rounded-md">
        <div className="bg-white border border-[#FAC775] rounded-md p-4 text-center max-w-xs">
          <p className="font-serif italic text-xs text-[#993C1D] mb-1">Member feature</p>
          <p className="font-serif text-sm mb-3">{feature}</p>
          <Link
            href="/pricing"
            className="inline-block bg-[#712B13] text-white text-xs py-1.5 px-4 rounded-md hover:bg-[#4A1B0C]"
          >
            Upgrade →
          </Link>
        </div>
      </div>
    </div>
  );
}
