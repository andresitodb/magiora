import Link from 'next/link';
import CastingCatalogue from '@/components/CastingCatalogue';

export const dynamic = 'force-dynamic';

export default async function WorkspaceCastingBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/casting" className="k-link mb-6 inline-block text-sm">
        ← Casting workspace
      </Link>
      <CastingCatalogue
        params={params}
        pathname="/dashboard/casting/browse"
        detailContext="workspace"
      />
    </div>
  );
}
