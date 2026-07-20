import Nav from '@/components/Nav';
import CardGridSkeleton from '@/components/CardGridSkeleton';

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section">
        <div className="mb-10 space-y-3">
          <div className="k-skeleton h-4 w-36" />
          <div className="k-skeleton h-12 w-56" />
          <div className="k-skeleton h-5 w-full max-w-xl" />
        </div>
        <div className="k-card h-44 mb-10" />
        <CardGridSkeleton cards={6} />
      </main>
    </div>
  );
}
