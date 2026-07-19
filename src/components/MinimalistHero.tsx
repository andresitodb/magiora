import { type Accent } from '@/lib/profile_themes';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function MinimalistHero({
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
    <div className="text-center py-12 md:py-16 mb-10">
      <div
        className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mx-auto mb-8 ring-4"
        style={{ '--tw-ring-color': accent.accentSoft, backgroundColor: accent.accentSoft } as any}
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

      <h1
        className="font-serif text-3xl md:text-5xl font-medium tracking-tight flex items-center justify-center gap-3"
        style={{ color: accent.text }}
      >
        {profile.display_name}
        {profile.verified && <VerifiedBadge size="md" />}
      </h1>

      <p
        className="font-serif italic uppercase tracking-widest text-xs mt-3"
        style={{ color: accent.accent }}
      >
        {primaryTitle}
        {roleTitles.length > 1 && ` · ${roleTitles.slice(1).join(' · ')}`}
      </p>

      {(profile.location_city || profile.location_state) && (
        <p
          className="font-serif text-sm mt-2"
          style={{ color: accent.textMuted }}
        >
          {profile.location_city}
          {profile.location_city && profile.location_state && ', '}
          {profile.location_state}
        </p>
      )}

      <div
        className="w-12 h-px mx-auto mt-8"
        style={{ backgroundColor: accent.border }}
      />
    </div>
  );
}
