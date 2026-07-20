export default function CardGridSkeleton({
  cards = 8,
  aspect = 'portrait',
}: {
  cards?: number;
  aspect?: 'portrait' | 'poster';
}) {
  return (
    <div
      aria-label="Loading content"
      aria-busy="true"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
    >
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="k-card" aria-hidden="true">
          <div className={`k-skeleton ${aspect === 'poster' ? 'aspect-[3/4]' : 'aspect-[4/5]'}`} />
          <div className="p-4 space-y-3">
            <div className="k-skeleton h-3 w-1/3" />
            <div className="k-skeleton h-5 w-3/4" />
            <div className="k-skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
