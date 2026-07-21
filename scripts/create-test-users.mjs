// scripts/create-test-users.mjs
//
// Creates 4 test premium users with realistic profiles.
// Run from project root: node scripts/create-test-users.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local
//
// IMPORTANT: This uses the service role key, which bypasses RLS. Never expose this
// key on the client. This script is for local dev/staging only.

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = process.env.TEST_USER_PASSWORD;

if (!PASSWORD) {
  console.error('Missing TEST_USER_PASSWORD in .env.local');
  process.exit(1);
}

const USERS = [
  {
    email: 'maria.actress@magiora.test',
    display_name: 'María Fernanda Velázquez',
    slug: 'maria-velazquez',
    role_titles: ['Actor'],
    bio: "Bilingual actress based in Miami, born in Caracas. Trained at the Lee Strasberg Theatre & Film Institute. Drawn to roles that sit between languages — characters who code-switch, who are between places. Equally at home in dramatic and comedic material. Working professionally in independent film, web series, and Spanish-language commercials since 2019.",
    location_city: 'Miami',
    location_state: 'FL',
    languages: ['es', 'en', 'pt'],
    gender: 'Female',
    age_range_min: 25,
    age_range_max: 35,
    skills: ['Meisner', 'Accent — Spanish (Cuban)', 'Accent — Spanish (Argentine)', 'Salsa', 'Bachata', 'Singing — Alto', 'Improvisation', 'Stage combat — hand-to-hand'],
    headshot_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    gallery: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
      'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    ],
    physical_details: {
      height_ft: '5', height_in: '6', weight_lb: '128',
      hair_color: 'Dark brown', eye_color: 'Brown', body_type: 'Athletic',
      dress_size: '4', shoe_size: '7',
    },
    demo_reel_url: 'https://vimeo.com/example/maria-reel',
    video_links: [
      { label: 'Dramatic scene — Drama clinic 2024', url: 'https://vimeo.com/example/maria-drama' },
      { label: 'Comedy reel — short cuts', url: 'https://vimeo.com/example/maria-comedy' },
    ],
    experience: [
      { year: '2024', title: 'Cuando el río suena', project_type: 'feature_film', role: 'Supporting — Lucía', project: 'dir. Rafael Mendez · Sibilino Productions', link: '' },
      { year: '2023', title: 'Self-tape clinic', project_type: 'short_film', role: 'Lead — Carmen', project: 'dir. Andrés Sciamarella', link: '' },
      { year: '2022', title: 'Café Cubano', project_type: 'commercial', role: 'Principal', project: 'Goya Foods national spot', link: '' },
      { year: '2021', title: 'Las Hermanas', project_type: 'theater', role: 'Lead — Ana', project: 'Miami Hispanic Cultural Arts Center', link: '' },
    ],
    recommendations: [
      { from_name: 'Andrés Sciamarella', from_role: 'Director', quote: "María has a stillness on camera that's almost unfair. She listens harder than anyone in the room.", project: 'Self-tape clinic' },
    ],
    contact_email: 'maria.velazquez@example.com',
    website_url: 'https://mariavelazquez.com',
    social_links: { instagram: '@mariavelazquezactor', vimeo: 'vimeo.com/mariavelazquez', imdb: 'imdb.com/name/example' },
    representation: { agency: 'Hispanic Talent Agency Miami', manager: '' },
  },
  {
    email: 'carlos.dp@magiora.test',
    display_name: 'Carlos Tomé',
    slug: 'carlos-tome',
    role_titles: ['Director of Photography', 'Camera Operator'],
    bio: "Argentine cinematographer, Miami since 2017. I'm drawn to natural light, intimate camera work, and stories that earn their close-ups. Background in documentary, slowly moving into narrative. Two indie features and seven shorts in the last three years. Equally comfortable on RED Komodo, ARRI Alexa Mini, and Sony FX3.",
    location_city: 'Miami',
    location_state: 'FL',
    languages: ['es', 'en'],
    gender: null,
    age_range_min: null,
    age_range_max: null,
    skills: ['Steadicam operation', 'Drone piloting (FAA Part 107)', 'Underwater filming', 'RED Komodo', 'ARRI Alexa', 'DaVinci Resolve', 'Lighting design'],
    headshot_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    gallery: [
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600',
      'https://images.unsplash.com/photo-1518930259200-3e5f1d3f9f5b?w=600',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600',
    ],
    physical_details: {},
    equipment: [
      { category: 'Camera bodies', items: 'RED Komodo X (own), Sony FX3 with cage' },
      { category: 'Lenses', items: 'Sigma Cine Primes 25/35/50/85, Sigma 18-35 Art' },
      { category: 'Lighting', items: 'Aputure 600d Pro, 300d Mark II, Nanlite Forza 60 (x2), full grip package' },
      { category: 'Grip', items: 'Easyrig Vario 5, DJI Ronin 4D, Steadicam Aero 30' },
    ],
    demo_reel_url: 'https://vimeo.com/example/carlos-reel-2024',
    video_links: [
      { label: 'Narrative feature — sample scenes', url: 'https://vimeo.com/example/carlos-narrative' },
      { label: 'Documentary work — selects', url: 'https://vimeo.com/example/carlos-doc' },
      { label: 'Music video — Bad Bunny concept piece', url: 'https://vimeo.com/example/carlos-mv' },
    ],
    experience: [
      { year: '2024', title: 'The Performance', project_type: 'feature_film', role: 'Director of Photography', project: 'dir. Andrés Sciamarella · Sibilino Productions', link: '' },
      { year: '2023', title: 'Habana, mañana', project_type: 'feature_film', role: 'Director of Photography', project: 'dir. Laura Quintero', link: '' },
      { year: '2023', title: 'Voces — episodes 1–4', project_type: 'series', role: 'DP', project: 'PBS digital documentary series', link: '' },
      { year: '2022', title: 'Bad Bunny — concept piece', project_type: 'music_video', role: 'DP', project: 'dir. Mariana Lúa', link: '' },
    ],
    recommendations: [
      { from_name: 'Laura Quintero', from_role: 'Director', quote: "Carlos understands light the way a musician understands silence. He waits.", project: 'Habana, mañana' },
    ],
    contact_email: 'carlos.tome@example.com',
    website_url: 'https://carlostome.com',
    social_links: { instagram: '@carlostomedp', vimeo: 'vimeo.com/carlostome' },
    representation: {},
  },
  {
    email: 'ana.director@magiora.test',
    display_name: 'Ana Lucía Restrepo',
    slug: 'ana-restrepo',
    role_titles: ['Director', 'Screenwriter', 'Producer'],
    bio: "Colombian filmmaker based between Bogotá and Miami. Writer-director with a focus on women navigating institutions — family, church, work. Three feature scripts, two produced. My work has played at TIFF, San Sebastián, and Cartagena. I'm developing my next feature, a thriller about a casting director who realizes she's auditioning the wrong people for the wrong film.",
    location_city: 'Miami',
    location_state: 'FL',
    languages: ['es', 'en'],
    gender: null,
    age_range_min: null,
    age_range_max: null,
    skills: ['Budgeting & line producing', 'Scheduling (Movie Magic)', 'Final Cut Pro', 'Improvisation'],
    headshot_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
    gallery: [
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
    ],
    physical_details: {},
    equipment: [],
    demo_reel_url: 'https://vimeo.com/example/ana-reel',
    video_links: [
      { label: 'El Peso del Encierro — feature trailer', url: 'https://vimeo.com/example/ana-peso' },
      { label: 'Director Q&A — Cartagena 2023', url: 'https://vimeo.com/example/ana-qa' },
    ],
    experience: [
      { year: '2024', title: 'The Casting', project_type: 'feature_film', role: 'Writer-Director (in dev)', project: 'Sibilino Productions', link: '' },
      { year: '2023', title: 'El Peso del Encierro', project_type: 'feature_film', role: 'Writer-Director', project: 'TIFF Discovery 2023', link: '' },
      { year: '2021', title: 'El Rebaño — pilot', project_type: 'series', role: 'Co-creator, Director', project: 'Spanish-language anthology', link: '' },
      { year: '2019', title: 'Las Hijas', project_type: 'short_film', role: 'Writer-Director', project: 'Cinéfondation, Cannes', link: '' },
    ],
    recommendations: [
      { from_name: 'Carlos Tomé', from_role: 'Cinematographer', quote: "Ana writes the scene three different ways before lunch and shoots the fourth one she just thought of.", project: 'El Peso del Encierro' },
    ],
    contact_email: 'ana.restrepo@example.com',
    website_url: 'https://anarestrepo.film',
    social_links: { instagram: '@anarestrepofilm' },
    representation: { agency: 'Latitud Casting & Talent', manager: 'Sofía Vega' },
  },
  {
    email: 'luis.composer@magiora.test',
    display_name: 'Luis Carmona',
    slug: 'luis-carmona',
    role_titles: ['Composer', 'Sound Designer', 'Music Supervisor'],
    bio: "Composer and sound designer. Cuban-born, Miami-raised. I score independent film and design sound for narrative work. Background in classical piano and electronic production. I love scoring films where the music is the third character — present, but never explaining what the audience should feel.",
    location_city: 'Miami',
    location_state: 'FL',
    languages: ['es', 'en'],
    gender: null,
    age_range_min: null,
    age_range_max: null,
    skills: ['Piano', 'Singing — Tenor', 'Pro Tools', 'Logic Pro', 'Ableton Live', 'Music production', 'Songwriting'],
    headshot_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
    gallery: [],
    physical_details: {},
    equipment: [
      { category: 'Audio', items: 'Native Instruments Komplete Kontrol S88, Universal Audio Apollo X8p, Neumann KH 310 monitors' },
      { category: 'Computing', items: 'Mac Studio M2 Max, Pro Tools Studio license, full Spitfire Audio libraries' },
    ],
    demo_reel_url: 'https://vimeo.com/example/luis-reel',
    video_links: [
      { label: 'Score demo — feature work', url: 'https://vimeo.com/example/luis-score' },
      { label: 'Sound design reel — narrative', url: 'https://vimeo.com/example/luis-sound' },
    ],
    experience: [
      { year: '2024', title: 'The Performance', project_type: 'feature_film', role: 'Composer & Sound Designer', project: 'dir. Andrés Sciamarella · Sibilino Productions', link: '' },
      { year: '2023', title: 'Habana, mañana', project_type: 'feature_film', role: 'Composer', project: 'dir. Laura Quintero', link: '' },
      { year: '2023', title: 'El Rebaño', project_type: 'series', role: 'Music Supervisor', project: 'Spanish-language anthology', link: '' },
    ],
    recommendations: [],
    contact_email: 'luis.carmona@example.com',
    website_url: '',
    social_links: { instagram: '@luiscarmonamusic', vimeo: 'vimeo.com/luiscarmona' },
    representation: {},
  },
];

async function createUser(u) {
  console.log(`\n→ Creating ${u.email} (${u.display_name})...`);

  // Step 1: Create auth user
  let { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    // If already exists, fetch the existing user
    if (authError.message.includes('already')) {
      console.log(`  ⓘ User already exists, fetching...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((x) => x.email === u.email);
      if (!existing) {
        console.log(`  ✗ Could not find existing user`);
        return;
      }
      authData = { user: existing };
    } else {
      console.log(`  ✗ Auth error: ${authError.message}`);
      return;
    }
  }

  const userId = authData.user.id;
  console.log(`  ✓ Auth user: ${userId}`);

  // Step 2: Wait a moment for the trigger to create the profile row, then update
  await new Promise((r) => setTimeout(r, 500));

  // Step 3: Update the profile with all the data
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: 'member',
      display_name: u.display_name,
      slug: u.slug,
      role_titles: u.role_titles,
      role_category: u.role_titles[0].toLowerCase().includes('actor') ? 'actor'
        : u.role_titles[0].toLowerCase().includes('director of photography') ? 'cinematographer'
        : u.role_titles[0].toLowerCase().includes('cinematogr') ? 'cinematographer'
        : u.role_titles[0].toLowerCase().includes('director') ? 'director'
        : u.role_titles[0].toLowerCase().includes('composer') ? 'sound'
        : u.role_titles[0].toLowerCase().includes('sound') ? 'sound'
        : u.role_titles[0].toLowerCase().includes('producer') ? 'producer'
        : 'crew_other',
      bio: u.bio,
      location_city: u.location_city,
      location_state: u.location_state,
      languages: u.languages,
      skills: u.skills,
      gender: u.gender,
      age_range_min: u.age_range_min,
      age_range_max: u.age_range_max,
      headshot_url: u.headshot_url,
      gallery: u.gallery,
      physical_details: u.physical_details,
      equipment: u.equipment ?? [],
      demo_reel_url: u.demo_reel_url,
      video_links: u.video_links,
      experience: u.experience,
      recommendations: u.recommendations,
      contact_email: u.contact_email,
      website_url: u.website_url,
      social_links: u.social_links,
      representation: u.representation,
      visible: true,
      approved: true,
    })
    .eq('id', userId);

  if (profileError) {
    console.log(`  ✗ Profile error: ${profileError.message}`);
    return;
  }

  console.log(`  ✓ Profile created · /m/${u.slug}`);
}

console.log('Creating test users — password for all: ' + PASSWORD);
for (const u of USERS) {
  await createUser(u);
}
console.log('\n✓ Done.\n');
console.log('Login credentials for all users:');
console.log('  Password: ' + PASSWORD + '\n');
for (const u of USERS) {
  console.log(`  ${u.email} → /m/${u.slug} (${u.role_titles[0]})`);
}
