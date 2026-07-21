import CardGridSkeleton from '@/components/CardGridSkeleton';

export default function AdminProjectsLoading() {
  return <div><div className="mb-8 h-10 w-48 animate-pulse bg-stone-200" /><CardGridSkeleton cards={4} /></div>;
}
