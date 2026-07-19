// Curated catalog of role titles, mapped to categories.
// Used by RoleSelector for the multi-select with autocomplete.

export const ROLE_TITLES_BY_CATEGORY: Record<string, string[]> = {
  actor: [
    'Actor',
    'Lead Actor',
    'Supporting Actor',
    'Background Actor',
    'Voice Actor',
    'Stunt Performer',
  ],
  director: [
    'Director',
    'Co-Director',
    'Assistant Director',
    '1st AD',
    '2nd AD',
    'Casting Director',
  ],
  writer: [
    'Writer',
    'Screenwriter',
    'Story Editor',
    'Script Doctor',
  ],
  producer: [
    'Producer',
    'Executive Producer',
    'Line Producer',
    'Associate Producer',
    'Co-Producer',
    'Production Manager',
  ],
  cinematographer: [
    'Cinematographer',
    'Director of Photography',
    'DP',
    'Camera Operator',
    'Steadicam Operator',
    'Drone Operator',
    '1st AC',
    '2nd AC',
    'DIT',
  ],
  editor: [
    'Editor',
    'Assistant Editor',
    'Colorist',
    'VFX Editor',
  ],
  sound: [
    'Sound Designer',
    'Sound Mixer',
    'Boom Operator',
    'Composer',
    'Music Supervisor',
    'Foley Artist',
    'Re-recording Mixer',
  ],
  production_designer: [
    'Production Designer',
    'Art Director',
    'Set Decorator',
    'Set Designer',
  ],
  costume: [
    'Costume Designer',
    'Costume Supervisor',
    'Wardrobe Stylist',
  ],
  makeup_hair: [
    'Makeup Artist',
    'SFX Makeup',
    'Hair Stylist',
    'Body Painter',
  ],
  crew_other: [
    'Gaffer',
    'Key Grip',
    'Best Boy',
    'Script Supervisor',
    'VFX Artist',
    'Stunt Coordinator',
    'Production Assistant',
    'PA',
    'Location Manager',
    'Intimacy Coordinator',
  ],
};

// Flat lookup for category lookup by title.
const TITLE_TO_CATEGORY: Record<string, string> = {};
for (const [category, titles] of Object.entries(ROLE_TITLES_BY_CATEGORY)) {
  for (const title of titles) {
    TITLE_TO_CATEGORY[title.toLowerCase()] = category;
  }
}

export function getCategoryForTitle(title: string): string | null {
  return TITLE_TO_CATEGORY[title.toLowerCase()] ?? null;
}

export const ALL_TITLES: string[] = Object.entries(ROLE_TITLES_BY_CATEGORY)
  .flatMap(([category, titles]) => titles.map((t) => ({ title: t, category })))
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((x) => x.title);
