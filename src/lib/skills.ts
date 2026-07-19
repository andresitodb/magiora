// Curated skills list for the autocomplete on profile editor.
// Grouped by category for visual browsing but stored as flat strings.

export interface SkillEntry {
  name: string;
  category: string;
}

export const SKILLS: SkillEntry[] = [
  // Acting technique
  { name: 'Meisner', category: 'Acting technique' },
  { name: 'Method', category: 'Acting technique' },
  { name: 'Stanislavski', category: 'Acting technique' },
  { name: 'Chekhov', category: 'Acting technique' },
  { name: 'Practical Aesthetics', category: 'Acting technique' },
  { name: 'Improvisation', category: 'Acting technique' },
  { name: 'Clown', category: 'Acting technique' },
  { name: 'Mask work', category: 'Acting technique' },
  { name: 'Commedia dell\'arte', category: 'Acting technique' },
  { name: 'Cold reading', category: 'Acting technique' },
  { name: 'Stand-up comedy', category: 'Acting technique' },
  { name: 'Sketch comedy', category: 'Acting technique' },
  { name: 'Voice acting', category: 'Acting technique' },
  { name: 'Motion capture', category: 'Acting technique' },

  // Voice & singing
  { name: 'Singing — Soprano', category: 'Voice & singing' },
  { name: 'Singing — Alto', category: 'Voice & singing' },
  { name: 'Singing — Tenor', category: 'Voice & singing' },
  { name: 'Singing — Baritone', category: 'Voice & singing' },
  { name: 'Singing — Bass', category: 'Voice & singing' },
  { name: 'Sight-reading', category: 'Voice & singing' },
  { name: 'Beatboxing', category: 'Voice & singing' },
  { name: 'Rapping', category: 'Voice & singing' },
  { name: 'Whistling', category: 'Voice & singing' },

  // Dance
  { name: 'Ballet', category: 'Dance' },
  { name: 'Contemporary dance', category: 'Dance' },
  { name: 'Modern dance', category: 'Dance' },
  { name: 'Jazz dance', category: 'Dance' },
  { name: 'Tap dance', category: 'Dance' },
  { name: 'Hip-hop', category: 'Dance' },
  { name: 'Breakdance', category: 'Dance' },
  { name: 'Salsa', category: 'Dance' },
  { name: 'Bachata', category: 'Dance' },
  { name: 'Tango', category: 'Dance' },
  { name: 'Flamenco', category: 'Dance' },
  { name: 'Ballroom', category: 'Dance' },
  { name: 'Belly dance', category: 'Dance' },
  { name: 'Afro-Cuban', category: 'Dance' },
  { name: 'Capoeira', category: 'Dance' },

  // Stage combat & stunts
  { name: 'Stage combat — hand-to-hand', category: 'Combat & stunts' },
  { name: 'Stage combat — sword', category: 'Combat & stunts' },
  { name: 'Stage combat — knife', category: 'Combat & stunts' },
  { name: 'Stage combat — quarterstaff', category: 'Combat & stunts' },
  { name: 'Boxing', category: 'Combat & stunts' },
  { name: 'Kickboxing', category: 'Combat & stunts' },
  { name: 'Muay Thai', category: 'Combat & stunts' },
  { name: 'Jiu-jitsu', category: 'Combat & stunts' },
  { name: 'Krav Maga', category: 'Combat & stunts' },
  { name: 'Karate', category: 'Combat & stunts' },
  { name: 'Taekwondo', category: 'Combat & stunts' },
  { name: 'Fencing', category: 'Combat & stunts' },
  { name: 'Wirework', category: 'Combat & stunts' },
  { name: 'High falls', category: 'Combat & stunts' },
  { name: 'Fire stunts', category: 'Combat & stunts' },

  // Sports & physical
  { name: 'Yoga', category: 'Sports' },
  { name: 'Pilates', category: 'Sports' },
  { name: 'Rock climbing', category: 'Sports' },
  { name: 'Parkour', category: 'Sports' },
  { name: 'Gymnastics', category: 'Sports' },
  { name: 'Surfing', category: 'Sports' },
  { name: 'Skateboarding', category: 'Sports' },
  { name: 'Snowboarding', category: 'Sports' },
  { name: 'Skiing', category: 'Sports' },
  { name: 'Soccer', category: 'Sports' },
  { name: 'Basketball', category: 'Sports' },
  { name: 'Tennis', category: 'Sports' },
  { name: 'Swimming', category: 'Sports' },
  { name: 'Diving (scuba)', category: 'Sports' },
  { name: 'Archery', category: 'Sports' },
  { name: 'Marksmanship', category: 'Sports' },
  { name: 'Roller skating', category: 'Sports' },
  { name: 'Ice skating', category: 'Sports' },

  // Music
  { name: 'Piano', category: 'Music' },
  { name: 'Guitar (acoustic)', category: 'Music' },
  { name: 'Guitar (electric)', category: 'Music' },
  { name: 'Bass guitar', category: 'Music' },
  { name: 'Drums', category: 'Music' },
  { name: 'Violin', category: 'Music' },
  { name: 'Cello', category: 'Music' },
  { name: 'Saxophone', category: 'Music' },
  { name: 'Trumpet', category: 'Music' },
  { name: 'Flute', category: 'Music' },
  { name: 'Ukulele', category: 'Music' },
  { name: 'Harmonica', category: 'Music' },
  { name: 'Charango', category: 'Music' },
  { name: 'Bandoneón', category: 'Music' },
  { name: 'DJing', category: 'Music' },
  { name: 'Songwriting', category: 'Music' },
  { name: 'Music production', category: 'Music' },

  // Accents (separate from languages — accent-in-a-language)
  { name: 'Accent — American Southern', category: 'Accents' },
  { name: 'Accent — American Midwest', category: 'Accents' },
  { name: 'Accent — American New York', category: 'Accents' },
  { name: 'Accent — American Texan', category: 'Accents' },
  { name: 'Accent — British RP', category: 'Accents' },
  { name: 'Accent — Cockney', category: 'Accents' },
  { name: 'Accent — Scottish', category: 'Accents' },
  { name: 'Accent — Irish', category: 'Accents' },
  { name: 'Accent — Australian', category: 'Accents' },
  { name: 'Accent — French', category: 'Accents' },
  { name: 'Accent — German', category: 'Accents' },
  { name: 'Accent — Italian', category: 'Accents' },
  { name: 'Accent — Russian', category: 'Accents' },
  { name: 'Accent — Spanish (Mexican)', category: 'Accents' },
  { name: 'Accent — Spanish (Cuban)', category: 'Accents' },
  { name: 'Accent — Spanish (Argentine)', category: 'Accents' },
  { name: 'Accent — Spanish (Castilian)', category: 'Accents' },
  { name: 'Accent — Brazilian Portuguese', category: 'Accents' },

  // Vehicles
  { name: 'Manual transmission', category: 'Vehicles' },
  { name: 'Motorcycle', category: 'Vehicles' },
  { name: 'Commercial truck (CDL)', category: 'Vehicles' },
  { name: 'Boat / yacht', category: 'Vehicles' },
  { name: 'Jet ski', category: 'Vehicles' },
  { name: 'Horseback riding', category: 'Vehicles' },
  { name: 'Bicycle tricks', category: 'Vehicles' },
  { name: 'Tractor', category: 'Vehicles' },

  // Specialty
  { name: 'American Sign Language (ASL)', category: 'Specialty' },
  { name: 'Magic tricks', category: 'Specialty' },
  { name: 'Juggling', category: 'Specialty' },
  { name: 'Fire breathing', category: 'Specialty' },
  { name: 'Circus arts', category: 'Specialty' },
  { name: 'Puppetry', category: 'Specialty' },
  { name: 'Drag performance', category: 'Specialty' },
  { name: 'Hosting / MC', category: 'Specialty' },
  { name: 'Military bearing', category: 'Specialty' },
  { name: 'Combat training (real)', category: 'Specialty' },

  // Crew — Camera & lighting
  { name: 'Steadicam operation', category: 'Camera & lighting' },
  { name: 'Drone piloting (FAA Part 107)', category: 'Camera & lighting' },
  { name: 'Underwater filming', category: 'Camera & lighting' },
  { name: 'Aerial cinematography', category: 'Camera & lighting' },
  { name: 'RED Komodo', category: 'Camera & lighting' },
  { name: 'ARRI Alexa', category: 'Camera & lighting' },
  { name: 'Sony Venice', category: 'Camera & lighting' },
  { name: 'Lighting design', category: 'Camera & lighting' },

  // Crew — Post production
  { name: 'DaVinci Resolve', category: 'Post production' },
  { name: 'Adobe Premiere', category: 'Post production' },
  { name: 'Final Cut Pro', category: 'Post production' },
  { name: 'Avid Media Composer', category: 'Post production' },
  { name: 'After Effects', category: 'Post production' },
  { name: 'Pro Tools', category: 'Post production' },
  { name: 'Logic Pro', category: 'Post production' },
  { name: 'Ableton Live', category: 'Post production' },
  { name: 'Photoshop', category: 'Post production' },
  { name: 'Cinema 4D', category: 'Post production' },
  { name: 'Blender', category: 'Post production' },
  { name: 'Maya', category: 'Post production' },
  { name: 'Unreal Engine', category: 'Post production' },
  { name: 'Unity', category: 'Post production' },
  { name: 'Nuke (compositing)', category: 'Post production' },

  // Crew — Production
  { name: 'Budgeting & line producing', category: 'Production' },
  { name: 'Scheduling (Movie Magic)', category: 'Production' },
  { name: 'Continuity tracking', category: 'Production' },
  { name: 'Permits & locations', category: 'Production' },
  { name: 'SAG-AFTRA paperwork', category: 'Production' },
];

// Group skills by category for the UI
export function groupedSkills(): Record<string, SkillEntry[]> {
  const groups: Record<string, SkillEntry[]> = {};
  for (const skill of SKILLS) {
    if (!groups[skill.category]) groups[skill.category] = [];
    groups[skill.category].push(skill);
  }
  return groups;
}
