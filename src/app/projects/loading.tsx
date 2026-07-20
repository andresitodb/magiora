import Nav from '@/components/Nav';
import CardGridSkeleton from '@/components/CardGridSkeleton';

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />
      <main className="k-container k-section">
        <div className="mb-10 space-y-3">
          <div className="k-skeleton h-4 w-32" />
          <div className="k-skeleton h-12 w-48" />
          <div className="k-skeleton h-5 w-full max-w-lg" />
        </div>
        <CardGridSkeleton cards={8} aspect="poster" />
      </main>
    </div>
  );
}
