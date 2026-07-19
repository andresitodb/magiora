export default function VerifiedBadge({
  size = 'md',
  showLabel = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const dimensions = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  }[size];

  return (
    <span
      title="Verified member"
      className="inline-flex items-center gap-1.5"
    >
      <span
        className={`${dimensions} inline-flex items-center justify-center bg-[#712B13] text-white rounded-full font-bold`}
      >
        ✓
      </span>
      {showLabel && (
        <span className="font-serif italic text-xs text-[#712B13]">Verified</span>
      )}
    </span>
  );
}
