import { type Accent } from '@/lib/profile_themes';
import VerifiedBadge from '@/components/VerifiedBadge';
import type { ProfileHeroData } from '@/components/profileHeroTypes';

export default function PortraitHero({
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
    <div className="text-center py-6 md:py-10 mb-10">
      {/* Photo card with thin frame */}
      <div
        className="inline-block mb-6 md:mb-8"
        style={{
          padding: '12px',
          backgroundColor: accent.card,
          border: `1px solid ${accent.border}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="w-56 h-72 md:w-72 md:h-96 overflow-hidden"
          style={{ backgroundColor: accent.accentSoft }}
        >
          {profile.headshot_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.headshot_url}
              alt={profile.display_name}
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 25%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-serif italic text-5xl"
              style={{ color: accent.accent }}
            >
              {(profile.display_name?.[0] ?? '?').toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Caption block, like a gallery installation label */}
      <h1
        className="font-serif text-3xl md:text-5xl font-medium flex items-center justify-center gap-3 mb-2"
        style={{ color: accent.text }}
      >
        {profile.display_name}
        {profile.verified && <VerifiedBadge size="md" />}
      </h1>

      <p
        className="font-serif italic text-base md:text-lg capitalize mb-1"
        style={{ color: accent.accent }}
      >
        — {primaryTitle}
        {roleTitles.length > 1 && (
          <span style={{ color: accent.textMuted }}>
            {' · '}
            {roleTitles.slice(1).join(' · ')}
          </span>
        )}{' '}
        —
      </p>

      {(profile.location_city || profile.location_state) && (
        <p
          className="font-serif text-sm md:text-base mt-1"
          style={{ color: accent.textMuted }}
        >
          {profile.location_city}
          {profile.location_city && profile.location_state && ', '}
          {profile.location_state}
        </p>
      )}

      {/* Decorative divider */}
      <div
        className="w-16 h-px mx-auto mt-6"
        style={{ backgroundColor: accent.border }}
      />
    </div>
  );
}
