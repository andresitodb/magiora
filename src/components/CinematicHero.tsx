import { type Accent } from '@/lib/profile_themes';
import VerifiedBadge from '@/components/VerifiedBadge';
import type { ProfileHeroData } from '@/components/profileHeroTypes';

export default function CinematicHero({
  profile,
  primaryTitle,
  roleTitles,
  accent,
}: {
  profile: ProfileHeroData;
  primaryTitle: string;
  roleTitles: string[];
  accent: Accent;
}) {
  return (
    <div
      className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/9] overflow-hidden -mx-4 md:mx-0 md:rounded-lg mb-10"
      style={{ backgroundColor: accent.accentSoft }}
    >
      {profile.headshot_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={profile.headshot_url}
          alt={profile.display_name}
          className="w-full h-full object-cover"
          // bias toward top: faces in headshots are typically in upper half
          style={{ objectPosition: '50% 25%' }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ color: accent.accent }}
        >
          <span className="font-serif italic text-6xl opacity-50">
            {(profile.display_name?.[0] ?? '?').toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient overlay for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 45%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10 text-white">
        <p className="font-serif italic text-sm md:text-base mb-1.5 capitalize opacity-90">
          {primaryTitle}
          {roleTitles.length > 1 && (
            <span className="opacity-70">
              {' · '}
              {roleTitles.slice(1).join(' · ')}
            </span>
          )}
        </p>
        <h1 className="font-serif text-3xl md:text-6xl font-medium flex items-center gap-3 leading-tight">
          {profile.display_name}
          {profile.verified && <VerifiedBadge size="lg" />}
        </h1>
        {(profile.location_city || profile.location_state) && (
          <p className="font-serif italic text-sm md:text-base opacity-80 mt-2">
            {profile.location_city}
            {profile.location_city && profile.location_state && ', '}
            {profile.location_state}
          </p>
        )}
      </div>
    </div>
  );
}
