// Curated list of role titles for the autocomplete.
// Each title maps to one of the broad categories used by the matching engine.
// Sorted alphabetically by display title.

export type RoleCategory =
  | 'actor'
  | 'director'
  | 'producer'
  | 'cinematographer'
  | 'editor'
  | 'sound'
  | 'writer'
  | 'production_designer'
  | 'makeup_hair'
  | 'costume'
  | 'crew_other';

export interface RoleTitle {
  title: string;
  category: RoleCategory;
}

export const ROLE_TITLES: RoleTitle[] = [
  { title: '1st Assistant Director', category: 'director' },
  { title: '2nd Assistant Director', category: 'director' },
  { title: 'Acting Coach', category: 'crew_other' },
  { title: 'Actor', category: 'actor' },
  { title: 'Art Director', category: 'production_designer' },
  { title: 'Assistant Editor', category: 'editor' },
  { title: 'Best Boy Electric', category: 'crew_other' },
  { title: 'Boom Operator', category: 'sound' },
  { title: 'Camera Operator', category: 'cinematographer' },
  { title: 'Casting Director', category: 'crew_other' },
  { title: 'Choreographer', category: 'crew_other' },
  { title: 'Cinematographer', category: 'cinematographer' },
  { title: 'Colorist', category: 'crew_other' },
  { title: 'Composer', category: 'sound' },
  { title: 'Costume Designer', category: 'costume' },
  { title: 'Costumer', category: 'costume' },
  { title: 'Dialect Coach', category: 'crew_other' },
  { title: 'Director', category: 'director' },
  { title: 'Director of Photography', category: 'cinematographer' },
  { title: 'Dolly Grip', category: 'crew_other' },
  { title: 'Drone Operator', category: 'cinematographer' },
  { title: 'Editor', category: 'editor' },
  { title: 'Executive Producer', category: 'producer' },
  { title: 'Foley Artist', category: 'sound' },
  { title: 'Gaffer', category: 'crew_other' },
  { title: 'Hair Stylist', category: 'makeup_hair' },
  { title: 'Intimacy Coordinator', category: 'crew_other' },
  { title: 'Key Grip', category: 'crew_other' },
  { title: 'Line Producer', category: 'producer' },
  { title: 'Location Manager', category: 'crew_other' },
  { title: 'Makeup Artist', category: 'makeup_hair' },
  { title: 'Music Supervisor', category: 'sound' },
  { title: 'Producer', category: 'producer' },
  { title: 'Production Assistant', category: 'crew_other' },
  { title: 'Production Coordinator', category: 'crew_other' },
  { title: 'Production Designer', category: 'production_designer' },
  { title: 'Production Manager', category: 'crew_other' },
  { title: 'Property Master', category: 'production_designer' },
  { title: 'Re-recording Mixer', category: 'sound' },
  { title: 'Screenwriter', category: 'writer' },
  { title: 'Script Doctor', category: 'writer' },
  { title: 'Script Supervisor', category: 'crew_other' },
  { title: 'Set Decorator', category: 'production_designer' },
  { title: 'SFX Makeup Artist', category: 'makeup_hair' },
  { title: 'Sound Designer', category: 'sound' },
  { title: 'Sound Mixer', category: 'sound' },
  { title: 'Steadicam Operator', category: 'cinematographer' },
  { title: 'Story Editor', category: 'writer' },
  { title: 'Stunt Coordinator', category: 'crew_other' },
  { title: 'Stunt Performer', category: 'crew_other' },
  { title: 'Unit Production Manager', category: 'crew_other' },
  { title: 'VFX Artist', category: 'crew_other' },
  { title: 'VFX Supervisor', category: 'crew_other' },
  { title: 'Voice Actor', category: 'actor' },
  { title: 'Wardrobe Supervisor', category: 'costume' },
];

// Helper: find the category for a given title string (exact match, case-insensitive)
export function categoryForTitle(title: string): RoleCategory | null {
  const found = ROLE_TITLES.find(
    (r) => r.title.toLowerCase() === title.trim().toLowerCase()
  );
  return found?.category ?? null;
}

// Fallback category when user typed a custom title we don't recognize
export const CUSTOM_FALLBACK_CATEGORY: RoleCategory = 'crew_other';
