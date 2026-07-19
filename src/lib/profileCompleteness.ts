// Compute profile completeness as a percentage 0-100.
// Used by the dashboard to nudge users to fill out their profile.

interface CompletenessCheck {
  weight: number;
  done: boolean;
  label: string;
}

export interface CompletenessResult {
  percent: number;
  missing: string[];
  total: number;
  done: number;
}

export function computeCompleteness(profile: any): CompletenessResult {
  const isActor =
    profile.role_category === 'actor' ||
    (profile.role_categories ?? []).includes('actor');
  const isCrew =
    profile.role_category &&
    !['actor', 'writer'].includes(profile.role_category);

  const checks: CompletenessCheck[] = [
    {
      weight: 12,
      done: !!profile.headshot_url,
      label: 'Add a headshot',
    },
    {
      weight: 10,
      done: (profile.bio?.length ?? 0) >= 80,
      label: 'Write a bio (at least 80 characters)',
    },
    {
      weight: 8,
      done: (profile.role_titles?.length ?? 0) > 0,
      label: 'Set at least one role title',
    },
    {
      weight: 6,
      done: !!profile.location_city,
      label: 'Add your city',
    },
    {
      weight: 4,
      done: (profile.languages?.length ?? 0) > 0,
      label: 'Add languages',
    },
    {
      weight: 10,
      done: (profile.skills?.length ?? 0) >= 3,
      label: 'Add at least 3 skills',
    },
    {
      weight: 12,
      done: (profile.experience?.length ?? 0) >= 1,
      label: 'Add at least one credit to your experience',
    },
    {
      weight: 6,
      done: !!profile.contact_email,
      label: 'Add a contact email',
    },
    {
      weight: 10,
      done: !!profile.demo_reel_url || (profile.video_links?.length ?? 0) > 0,
      label: 'Add a demo reel or video link',
    },
    {
      weight: 8,
      done: (profile.gallery?.length ?? 0) >= 2,
      label: 'Add at least 2 gallery photos',
    },
    {
      weight: 6,
      done: Object.keys(profile.social_links ?? {}).filter((k) => profile.social_links[k]).length >= 1,
      label: 'Add at least one social link',
    },
    // Conditional checks for actors
    ...(isActor
      ? [
          {
            weight: 4,
            done:
              profile.physical_details?.height_ft != null ||
              profile.physical_details?.weight_lb != null,
            label: 'Add your physical details',
          },
          {
            weight: 4,
            done: profile.age_range_min != null && profile.age_range_max != null,
            label: 'Set your "plays age" range',
          },
        ]
      : []),
    // Conditional check for crew
    ...(isCrew && !isActor
      ? [
          {
            weight: 8,
            done: (profile.equipment?.length ?? 0) >= 1,
            label: 'List the equipment / tools you work with',
          },
        ]
      : []),
  ];

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const doneSum = checks.filter((c) => c.done).reduce((sum, c) => sum + c.weight, 0);
  const percent = Math.round((doneSum / total) * 100);

  return {
    percent,
    missing: checks.filter((c) => !c.done).map((c) => c.label),
    total,
    done: doneSum,
  };
}
