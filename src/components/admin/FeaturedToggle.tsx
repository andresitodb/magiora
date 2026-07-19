// Featured toggle button — drop into /admin/members/[id]/page.tsx
//
// USAGE:
// import FeaturedToggle from '@/components/admin/FeaturedToggle';
// import { toggleFeatured } from './actions';
//
// <FeaturedToggle
//   profileId={profile.id}
//   isFeatured={!!profile.featured_at}
//   featuredAt={profile.featured_at}
//   action={toggleFeatured}
// />

export default function FeaturedToggle({
  profileId,
  isFeatured,
  featuredAt,
  action,
}: {
  profileId: string;
  isFeatured: boolean;
  featuredAt: string | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="inline-block">
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="action" value={isFeatured ? 'unfeature' : 'feature'} />
      <button
        type="submit"
        className={`text-xs px-3 py-1.5 rounded-md cursor-pointer font-medium transition-colors ${
          isFeatured
            ? 'bg-[#FAECE7] text-[#712B13] border border-[#712B13] hover:bg-[#FAC775]'
            : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
        }`}
        title={
          isFeatured
            ? `Featured since ${featuredAt ? new Date(featuredAt).toLocaleDateString() : ''}`
            : 'Feature this person on the home page'
        }
      >
        {isFeatured ? '★ Featured' : '☆ Feature'}
      </button>
    </form>
  );
}
