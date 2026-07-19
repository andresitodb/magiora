import { type Accent } from '@/lib/profile_themes';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function PolaroidHero({
  profile,
  primaryTitle,
  roleTitles,
  accent,
}: {
  profile: any;
  primaryTitle: string;
  roleTitles: string[];
  accent: Accent;
}) {
  return (
    <div className="text-center py-8 md:py-12 mb-10">
      <div className="inline-block relative mb-8" style={{ transform: 'rotate(-3deg)' }}>
        <div
          className="bg-white p-3 md:p-4 pb-12 md:pb-14 shadow-xl"
          style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
        >
          <div
            className="w-56 h-72 md:w-64 md:h-80 overflow-hidden"
            style={{ backgroundColor: accent.accentSoft }}
          >
            {profile.headshot_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.headshot_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-serif italic text-4xl"
                style={{ color: accent.accent }}
              >
                {(profile.display_name?.[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
          <p
            className="font-serif italic text-center mt-2 md:mt-3"
            style={{ color: accent.textMuted, fontFamily: '"Caveat", "Comic Sans MS", cursive', fontSize: '18px' }}
          >
            {profile.display_name?.split(' ')[0]?.toLowerCase()} ·{' '}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <p
        className="font-serif italic text-sm mb-2 capitalize"
        style={{ color: accent.accent }}
      >
        {primaryTitle}
        {roleTitles.length > 1 && (
          <span style={{ color: accent.textMuted }}>
            {' · '}
            {roleTitles.slice(1).join(' · ')}
          </span>
        )}
      </p>
      <h1
        className="font-serif text-4xl md:text-6xl font-medium flex items-center justify-center gap-3"
        style={{ color: accent.text }}
      >
        {profile.display_name}
        {profile.verified && <VerifiedBadge size="md" />}
      </h1>
      {(profile.location_city || profile.location_state) && (
        <p
          className="font-serif italic text-base mt-2"
          style={{ color: accent.textMuted }}
        >
          {profile.location_city}
          {profile.location_city && profile.location_state && ', '}
          {profile.location_state}
        </p>
      )}
    </div>
  );
}
