// Complete Magiora demo seed. Local/staging only; uses the existing Auth -> profiles trigger.
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// and DEMO_USER_PASSWORD (or TEST_USER_PASSWORD).

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_USER_PASSWORD ?? process.env.TEST_USER_PASSWORD;
if (!supabaseUrl || !serviceKey || !password) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DEMO_USER_PASSWORD.'
  );
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALLOWED = {
  castingProjectTypes: ['short_film', 'feature_film', 'pilot_series', 'music_video', 'commercial', 'documentary', 'web_series'],
  castingStatuses: ['draft', 'pending_review', 'open', 'closed', 'rejected'],
  castingProductionStatuses: ['pre_production', 'in_production'],
  castingUnionStatuses: ['sag_friendly', 'sag_only', 'non_union'],
  castingRoleTypes: ['lead', 'supporting', 'featured', 'day_player', 'background'],
  projectTypes: ['feature_film', 'short_film', 'series', 'pilot', 'web_series', 'music_video', 'commercial', 'documentary', 'theater', 'other'],
  projectStatuses: ['in_development', 'pre_production', 'in_production', 'post_production', 'completed', 'released'],
  eventStatuses: ['draft', 'pending_review', 'published', 'rejected'],
  spotlightStatuses: ['requested', 'in_progress', 'published', 'archived'],
};

const castingProjectType = (value) => value === 'pilot' ? 'pilot_series' : value;

function assertAllowed(label, value, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(`${label} has invalid seed value "${value}". Allowed: ${allowed.join(', ')}`);
  }
}

const portraitImages = [
  'photo-1494790108377-be9c29b29330', 'photo-1500648767791-00dcc994a43e',
  'photo-1534528741775-53994a69daeb', 'photo-1507003211169-0a1dd7228f2d',
  'photo-1531123897727-8f129e1688ce', 'photo-1506794778202-cad84cf45f1d',
  'photo-1544005313-94ddf0286df2', 'photo-1539571696357-5a69c17a67c6',
  'photo-1524504388940-b1c1722653e1', 'photo-1531384441138-2736e62e0919',
];
const professionImages = {
  actor: 'photo-1485846234645-a62644f84728',
  director: 'photo-1489599849927-2ee91cede3ba',
  cinematographer: 'photo-1485846234645-a62644f84728',
  producer: 'photo-1497366811353-6870744d04b2',
  writer: 'photo-1455390582262-044cdead277a',
  editor: 'photo-1574717024653-61fd2cf4d44d',
  sound: 'photo-1598488035139-bdbb2231ce04',
  production_designer: 'photo-1497366754035-f200968a6e72',
  costume: 'photo-1558618666-fcd25c85cd64',
  makeup_hair: 'photo-1487412947147-5cebf100ffc2',
  crew_other: 'photo-1492619375914-88005aa9e8fb',
};
const image = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const professionalRows = [
  ['Sofía Álvarez','sofia-alvarez','Actor','actor','Miami','FL',['es','en'],'Sofía brings restrained, observant performances to bilingual dramas and character-led comedies. Her recent work includes two festival shorts and a recurring role in a Miami-set web series.'],
  ['Malik Thompson','malik-thompson','Director','director','Atlanta','GA',['en'],'Malik directs intimate stories about family, ambition, and the places people leave behind. He works across narrative shorts, branded documentaries, and first features.'],
  ['Camila Rojas','camila-rojas','Director of Photography','cinematographer','Miami','FL',['es','en'],'Colombian cinematographer working with available light, expressive color, and compact crews. Camila shoots narrative, documentary, and music performance films.'],
  ['Noah Bennett','noah-bennett','Producer','producer','New York','NY',['en'],'Independent producer focused on director-driven features and practical pathways from development through festival release. Experienced with regional incentives and international co-productions.'],
  ['Lucía Ferrer','lucia-ferrer','Screenwriter','writer','Los Angeles','CA',['es','en'],'Lucía writes psychologically precise dramas and genre stories rooted in Latin American families. Her work has been developed through labs in Los Angeles, Madrid, and Bogotá.'],
  ['Ethan Park','ethan-park','Editor','editor','New York','NY',['en','ko'],'Ethan edits narrative films with an ear for performance and silence. His recent credits span a contained thriller, a dance documentary, and three festival shorts.'],
  ['Valentina Cruz','valentina-cruz','Production Designer','production_designer','Miami','FL',['es','en'],'Valentina builds tactile worlds from real locations, found objects, and disciplined color stories. She specializes in independent productions that need every frame to carry meaning.'],
  ['Mateo Silva','mateo-silva','Sound Designer','sound','Austin','TX',['es','en'],'Field recordist and sound designer drawn to layered urban environments and quiet interiors. Mateo handles production sound, editorial, and final mixes for independent film.'],
  ['Aisha Rahman','aisha-rahman','Actor','actor','New York','NY',['en','ur'],'Aisha is a stage-trained actor whose screen work centers emotionally intelligent leads and complicated professionals. She is equally comfortable with drama and dry comedy.'],
  ['Gabriel Moreau','gabriel-moreau','Composer','sound','New Orleans','LA',['en','fr'],'Composer blending chamber instrumentation, analog electronics, and location recordings. Gabriel creates scores that support atmosphere without explaining the scene.'],
  ['Renata Lima','renata-lima','Costume Designer','costume','Miami','FL',['pt','es','en'],'Brazilian costume designer researching character through texture, wear, and regional detail. Renata works across period shorts, contemporary features, and music videos.'],
  ['Daniel Kim','daniel-kim','Gaffer','crew_other','Los Angeles','CA',['en','ko'],'Daniel leads efficient lighting teams for narrative and commercial sets. Known for naturalistic interiors, careful power planning, and calm collaboration under tight schedules.'],
  ['Isabella Torres','isabella-torres','Actor','actor','Orlando','FL',['es','en'],'Isabella is a bilingual actor and movement performer with credits in independent features, immersive theater, and television commercials across Florida.'],
  ['Julian Reed','julian-reed','Documentary Director','director','Chicago','IL',['en'],'Julian makes observational documentaries about work, neighborhood memory, and changing cities. He often works as his own camera operator on long-form projects.'],
  ['Mariana Vélez','mariana-velez','Line Producer','producer','Bogotá','Colombia',['es','en'],'Mariana translates ambitious scripts into grounded production plans. She has managed location-heavy shoots, international crews, and projects from microbudget through mid-range independent features.'],
  ['Theo Martin','theo-martin','Colorist','editor','Los Angeles','CA',['en'],'Theo is a narrative colorist focused on natural skin tones, expressive night work, and preserving the intent of practical lighting across mixed-camera workflows.'],
  ['Nadia Okafor','nadia-okafor','Casting Director','crew_other','Atlanta','GA',['en'],'Nadia casts independent film and episodic projects throughout the Southeast, with a practice centered on specific performances and genuinely inclusive searches.'],
  ['Rafael Domínguez','rafael-dominguez','Actor','actor','San Juan','PR',['es','en'],'Rafael is a Puerto Rican actor with a background in improvisation and classical theater. His screen work ranges from warm ensemble comedy to grounded crime drama.'],
  ['Maya Chen','maya-chen','First Assistant Director','crew_other','New York','NY',['en','zh'],'Maya runs organized, humane sets. Her experience includes union shorts, location-intensive features, and music videos with complex company moves and performance schedules.'],
  ['Elena Petrov','elena-petrov','Makeup & Hair Designer','makeup_hair','Los Angeles','CA',['en','ru'],'Elena designs camera-ready makeup and hair for contemporary narratives, subtle aging work, and period references, with a strong understanding of continuity.'],
  ['Andre Williams','andre-williams','Cinematographer','cinematographer','Atlanta','GA',['en'],'Andre photographs character-driven work with graceful handheld movement and bold practical sources. He owns a compact cinema package suited to agile productions.'],
  ['Paloma Sánchez','paloma-sanchez','Writer-Director','director','Mexico City','Mexico',['es','en'],'Paloma writes and directs stories about friendship, class, and the private negotiations inside public rituals. Her shorts have screened across North America and Europe.'],
  ['Jonah Price','jonah-price','Location Sound Mixer','sound','Austin','TX',['en'],'Jonah records clean, detailed production sound in demanding locations. His kit supports narrative crews from intimate shorts through multi-camera independent features.'],
  ['Kiara Brooks','kiara-brooks','Actor','actor','Chicago','IL',['en'],'Kiara is an actor, vocalist, and teaching artist known for immediate emotional access and sharp comic timing. She works in film, theater, and voice performance.'],
  ['Tomás Echeverría','tomas-echeverria','Editor','editor','Miami','FL',['es','en'],'Tomás edits fiction and music films with a rhythmic, performance-first approach. He enjoys finding surprising structures inside documentary material and improvised scenes.'],
  ['Priya Desai','priya-desai','Producer','producer','New York','NY',['en','hi'],'Priya develops socially engaged films without losing sight of audience and genre. She supports filmmakers from early packaging through financing and distribution strategy.'],
  ['Leo Baptiste','leo-baptiste','Stunt Coordinator','crew_other','New Orleans','LA',['en','fr'],'Leo designs grounded action for independent productions, emphasizing story, performer safety, and achievable coverage. His background includes stage combat and precision driving.'],
  ['Anaïs Laurent','anais-laurent','Production Designer','production_designer','Montreal','QC',['fr','en'],'Anaïs creates production designs that feel lived-in rather than decorated. She works bilingually across Canadian and US co-productions, from interiors to practical builds.'],
  ['Diego Herrera','diego-herrera','Drone Operator','cinematographer','Miami','FL',['es','en'],'FAA-certified aerial cinematographer with experience over coastlines, cities, and controlled narrative action. Diego also works as a second-unit camera operator.'],
  ['Zoe Mitchell','zoe-mitchell','Script Supervisor','crew_other','Los Angeles','CA',['en'],'Zoe tracks continuity, coverage, and editorial intent with clarity and diplomacy. She has supported first-time directors and veteran crews on features and limited series.'],
].map(([display_name, slug, role, role_category, location_city, location_state, languages, bio], index) => ({
  email: `${slug}@demo.magiora.test`, display_name, slug, role_titles: [role], role_category,
  bio, location_city, location_state, languages, verified: index % 3 === 0,
  featured_at: index < 2 ? new Date(Date.now() - index * 86_400_000).toISOString() : null,
  headshot_url: image(portraitImages[index % portraitImages.length], 700),
  gallery: [image(professionImages[role_category] ?? professionImages.crew_other)],
}));

const projects = [
  ['demo-salt-line','Salt Line','A daughter returns to a disappearing island.','feature_film','in_development','Miami','FL','photo-1500530855697-b586d89ba3ee'],
  ['demo-after-the-last-train','After the Last Train','Two strangers wait out a citywide blackout.','short_film','pre_production','New York','NY','photo-1519608487953-e999c86e7455'],
  ['demo-orchid-house','Orchid House','A family archive begins answering back.','feature_film','post_production','San Juan','PR','photo-1507525428034-b723cf961d3e'],
  ['demo-static-between-us','Static Between Us','Late-night radio connects a fractured neighborhood.','pilot','in_production','Chicago','IL','photo-1598488035139-bdbb2231ce04'],
  ['demo-red-clay','Red Clay','Three generations reckon with land and inheritance.','documentary','completed','Atlanta','GA','photo-1500534314209-a25ddb2bd4297'],
  ['demo-morning-tide','Morning Tide','A fisherman and his son share one final dawn.','short_film','released','Miami','FL','photo-1476673160081-cf065607f449'],
  ['demo-velvet-season','Velvet Season','An aging singer prepares an impossible comeback.','feature_film','pre_production','New Orleans','LA','photo-1516280440614-37939bbacd81'],
  ['demo-second-unit','Second Unit','A workplace comedy behind an unfinished movie.','web_series','in_development','Los Angeles','CA','photo-1485846234645-a62644f84728'],
  ['demo-borrowed-light','Borrowed Light','Portraits of night-shift workers across the city.','documentary','post_production','New York','NY','photo-1519501025264-65ba15a82390'],
  ['demo-cicada-summer','Cicada Summer','Childhood friends meet again at a rural wedding.','feature_film','in_production','Austin','TX','photo-1500530855697-b586d89ba3ee'],
  ['demo-paper-moons','Paper Moons','A handmade animation about memory and migration.','other','completed','Montreal','QC','photo-1513364776144-60967b0f800f'],
  ['demo-blue-hour-session','Blue Hour Session','A live performance film captured before sunrise.','music_video','released','Mexico City','Mexico','photo-1493225457124-a3eb161ffa5f'],
].map(([slug,title,tagline,project_type,status,location_city,location_state,poster], index) => ({
  slug,title,tagline,project_type,status,location_city,location_state,
  description: `${tagline} A collaborative independent production built around performance, place, and a precise visual language.`,
  year: 2026, poster_url: image(poster), visible: true,
  featured_at: index === 0 ? new Date().toISOString() : null,
  ownerSlug: professionalRows[index].slug,
}));

const castingCalls = [
  ['Salt Line','Mara','lead','A marine biologist returning home after a decade away. Quiet authority and emotional restraint.','Miami','actor','Female',28,42,'2026-08-08'],
  ['After the Last Train','Eli','lead','A night-shift nurse whose patience masks a restless inner life.','New York','actor','Any',25,40,'2026-08-14'],
  ['Static Between Us','Radio Producer','supporting','Fast-thinking producer with dry humor and deep loyalty to the station.','Chicago','actor','Any',30,55,'2026-08-21'],
  ['Velvet Season','Young Celeste','featured','A gifted singer before fame changes the terms of every relationship.','New Orleans','actor','Female',18,27,'2026-08-28'],
  ['Cicada Summer','Mateo','supporting','A hometown friend who remembers every version of the people who left.','Austin','actor','Male',27,40,'2026-09-04'],
  ['Second Unit','Production Coordinator','lead','Hyper-competent coordinator holding a chaotic film together. Strong comedy instincts.','Los Angeles','actor','Any',25,45,'2026-09-10'],
  ['Borrowed Light','Additional Cinematographer','featured','Documentary camera operator comfortable with low-light observational work.','New York','cinematographer','Any',21,70,'2026-09-15'],
  ['Orchid House','Teenage Elena','supporting','A watchful teenager who discovers the family archive first.','San Juan','actor','Female',16,22,'2026-09-19'],
  ['Red Clay','Field Sound Recordist','featured','Documentary sound professional available for rural locations and small crews.','Atlanta','sound','Any',21,70,'2026-09-24'],
  ['Paper Moons','Assistant Animator','featured','Mixed-media animator for paper, paint, and frame-by-frame compositing.','Montreal','crew_other','Any',21,70,'2026-09-29'],
];

const events = [
  ['Magiora Summer Screening: New Florida Shorts',18,'O Cinema South Beach','1130 Washington Ave, Miami Beach, FL','photo-1489599849927-2ee91cede3ba'],
  ['Craft Night: Lighting Faces with Practical Sources',25,'Little River Studios','300 NE 71st St, Miami, FL','photo-1485846234645-a62644f84728'],
  ['Independent Producers Roundtable',33,'The LAB Miami','400 NW 26th St, Miami, FL','photo-1497366811353-6870744d04b2'],
  ['Rough Cut Salon: Documentary Works in Progress',40,'Savor Cinema','503 SE 6th St, Fort Lauderdale, FL','photo-1489599849927-2ee91cede3ba'],
  ['Actors and Directors: Building a Shared Language',48,'Miami Theater Center','9806 NE 2nd Ave, Miami Shores, FL','photo-1503095396549-807759245b35'],
  ['Sound for Small Crews',56,'Moonlighter FabLab','1661 Pennsylvania Ave, Miami Beach, FL','photo-1598488035139-bdbb2231ce04'],
  ['The First Feature: Financing Without Losing the Film',67,'Coral Gables Art Cinema','260 Aragon Ave, Coral Gables, FL','photo-1489599849927-2ee91cede3ba'],
  ['September Community Mixer',76,'The Citadel','8300 NE 2nd Ave, Miami, FL','photo-1528605248644-14dd04022da1'],
];

const interviews = [
  ['demo-camila-rojas-light','Camila Rojas on protecting natural light','Camila Rojas describes the preparation that lets a small camera crew stay responsive without sacrificing intention.',2],
  ['demo-malik-thompson-direction','Malik Thompson on directing the space between lines','A conversation about rehearsal, regional stories, and why a director must learn when not to intervene.',1],
  ['demo-ethan-park-editing','Ethan Park on finding the film in the edit','The editor talks about performance, productive uncertainty, and the first cut as a form of listening.',5],
  ['demo-valentina-cruz-design','Valentina Cruz builds worlds from what is already there','On location research, disciplined palettes, and making a modest art budget visible in the right ways.',6],
  ['demo-gabriel-moreau-score','Gabriel Moreau on music that leaves room','The composer discusses restraint, field recordings, and scores that become part of a film’s physical environment.',9],
  ['demo-priya-desai-producing','Priya Desai on producing for the long conversation','A practical discussion about development, trust, and building films that can survive the distance to an audience.',25],
];

function validateConstrainedSeedValues() {
  for (const project of projects) {
    assertAllowed('projects.project_type', project.project_type, ALLOWED.projectTypes);
    assertAllowed('projects.status', project.status, ALLOWED.projectStatuses);
  }
  for (const [index, call] of castingCalls.entries()) {
    assertAllowed('casting_calls.project_type', castingProjectType(projects[index].project_type), ALLOWED.castingProjectTypes);
    assertAllowed('casting_calls.status', 'open', ALLOWED.castingStatuses);
    assertAllowed('casting_calls.project_status', 'pre_production', ALLOWED.castingProductionStatuses);
    assertAllowed('casting_calls.union_status', index % 2 === 0 ? 'sag_friendly' : 'non_union', ALLOWED.castingUnionStatuses);
    assertAllowed('casting_calls.role_size', call[2], ALLOWED.castingRoleTypes);
  }
  for (const event of events) assertAllowed(`events.status (${event[0]})`, 'published', ALLOWED.eventStatuses);
  for (const interview of interviews) assertAllowed(`interviews.status (${interview[0]})`, 'published', ALLOWED.spotlightStatuses);
}

validateConstrainedSeedValues();

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email === email);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function ensureProfessional(row, index) {
  let authUser = await findUserByEmail(row.email);
  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: row.email, password, email_confirm: true,
      user_metadata: { display_name: row.display_name },
    });
    if (error) throw error;
    authUser = data.user;
  }
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', authUser.id).maybeSingle();
    if (profile) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  const { error } = await supabase.from('profiles').update({
    display_name: row.display_name, slug: row.slug, role_titles: row.role_titles,
    role_category: row.role_category, bio: row.bio, location_city: row.location_city,
    location_state: row.location_state, languages: row.languages, headshot_url: row.headshot_url,
    gallery: row.gallery, verified: row.verified, featured_at: row.featured_at,
    visible: true, approved: true, plan: index % 4 === 0 ? 'listed' : 'member',
    contact_email: row.email, skills: [], social_links: {}, representation: {},
  }).eq('id', authUser.id);
  if (error) throw error;
  return authUser.id;
}

async function removeExistingDemoContent() {
  const projectSlugs = projects.map((project) => project.slug);
  const { data: existingProjects } = await supabase.from('projects').select('id').in('slug', projectSlugs);
  const projectIds = (existingProjects ?? []).map((project) => project.id);
  if (projectIds.length) await supabase.from('project_credits').delete().in('project_id', projectIds);
  await supabase.from('casting_calls').delete().in('project_title', castingCalls.map((call) => call[0]));
  await supabase.from('events').delete().in('title', events.map((event) => event[0]));
  await supabase.from('interviews').delete().in('slug', interviews.map((interview) => interview[0]));
  await supabase.from('projects').delete().in('slug', projectSlugs);
}

const isoAfterDays = (days, hour = 19) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

console.log('Creating 30 demo professionals...');
const profileIds = new Map();
for (const [index, professional] of professionalRows.entries()) {
  profileIds.set(professional.slug, await ensureProfessional(professional, index));
  console.log(`  ✓ ${professional.display_name}`);
}

console.log('Replacing demo content...');
await removeExistingDemoContent();

const projectIds = new Map();
for (const project of projects) {
  const { ownerSlug, ...values } = project;
  const { data, error } = await supabase.from('projects').insert({
    ...values, owner_id: profileIds.get(ownerSlug),
  }).select('id').single();
  if (error) throw error;
  projectIds.set(project.slug, data.id);
}

const credits = projects.flatMap((project, projectIndex) => {
  const ownerIndex = projectIndex;
  const collaborators = [ownerIndex, (ownerIndex + 2) % 22, (ownerIndex + 5) % 22];
  return collaborators.map((profileIndex, position) => {
    const professional = professionalRows[profileIndex];
    return {
      project_id: projectIds.get(project.slug), profile_id: profileIds.get(professional.slug),
      external_name: null, role_title: professional.role_titles[0],
      role_category: professional.role_category, position, confirmed: true,
    };
  });
});
const { error: creditsError } = await supabase.from('project_credits').insert(credits);
if (creditsError) throw creditsError;

const castingRows = castingCalls.map((call, index) => ({
  posted_by: profileIds.get(projects[index % projects.length].ownerSlug), status: 'open',
  project_title: call[0], project_type: castingProjectType(projects[index % projects.length].project_type),
  project_status: 'pre_production', project_description: projects[index % projects.length].description,
  role_name: call[1], role_size: call[2], role_description: call[3], location_city: call[4],
  location_state: professionalRows[index].location_state, compensation: index % 3 === 0 ? '$350/day + meals and credit' : '$250/day + meals and credit',
  union_status: index % 2 === 0 ? 'sag_friendly' : 'non_union', target_role_category: call[5],
  target_gender: call[6], target_age_min: call[7], target_age_max: call[8],
  target_languages: index % 3 === 0 ? ['en','es'] : ['en'], target_skills: [],
  additional_requirements: 'Submit a current profile and a short note about your connection to the material.',
  application_deadline: call[9], shoot_start_date: isoAfterDays(85 + index * 3).slice(0,10),
  shoot_end_date: isoAfterDays(87 + index * 3).slice(0,10), published_at: new Date().toISOString(),
}));
const { error: castingError } = await supabase.from('casting_calls').insert(castingRows);
if (castingError) throw castingError;

const eventRows = events.map((event, index) => ({
  posted_by: profileIds.get(professionalRows[index].slug), status: 'published', title: event[0],
  description: 'A focused gathering for independent film professionals to share work, process, and practical experience with the Magiora community.',
  event_date: isoAfterDays(event[1]), end_date: isoAfterDays(event[1], 21),
  location_name: event[2], location_address: event[3], online_link: null,
  cover_image_url: image(event[4]), price_public: index % 3 === 0 ? 15 : 0,
  price_member: index % 3 === 0 ? 8 : 0, rsvp_required: true, max_capacity: 80 + index * 10,
}));
const { error: eventsError } = await supabase.from('events').insert(eventRows);
if (eventsError) throw eventsError;

const interviewRows = interviews.map((interview, index) => ({
  subject_profile_id: profileIds.get(professionalRows[interview[3]].slug),
  slug: interview[0], title: interview[1], intro: interview[2], status: 'published',
  hero_image_url: professionalRows[interview[3]].gallery[0],
  qa: [
    { question: 'What are you paying closer attention to in your work right now?', answer: 'I am interested in the decisions that make a frame or performance feel inevitable, even when the process behind it is exploratory.' },
    { question: 'What makes a collaboration productive?', answer: 'Clear preparation, specific language, and enough trust for someone to bring you an answer you did not already imagine.' },
    { question: 'What do you want independent film to protect?', answer: 'Its closeness to people and place—the ability to make something precise before it needs to become large.' },
  ],
  published_at: isoAfterDays(-20 + index), featured_at: index < 2 ? isoAfterDays(-index) : null,
}));
const { error: interviewsError } = await supabase.from('interviews').insert(interviewRows);
if (interviewsError) throw interviewsError;

async function exactCount(table, column, values) {
  const { count, error } = await supabase
    .from(table)
    .select(column, { count: 'exact', head: true })
    .in(column, values);
  if (error) throw error;
  return count ?? 0;
}

const finalCounts = {
  professionals: await exactCount('profiles', 'slug', professionalRows.map((row) => row.slug)),
  projects: await exactCount('projects', 'slug', projects.map((project) => project.slug)),
  castingCalls: await exactCount('casting_calls', 'project_title', castingCalls.map((call) => call[0])),
  events: await exactCount('events', 'title', events.map((event) => event[0])),
  spotlightInterviews: await exactCount('interviews', 'slug', interviews.map((interview) => interview[0])),
};
const expectedCounts = { professionals: 30, projects: 12, castingCalls: 10, events: 8, spotlightInterviews: 6 };
for (const [label, expected] of Object.entries(expectedCounts)) {
  if (finalCounts[label] !== expected) {
    throw new Error(`Expected ${expected} ${label}, found ${finalCounts[label]}.`);
  }
}

console.log('\nDemo seed complete:');
console.log('  30 professionals');
console.log('  12 projects and linked credits');
console.log('  10 open casting calls');
console.log('  8 upcoming events');
console.log('  6 published Spotlight interviews');
console.log('\nExample account: sofia-alvarez@demo.magiora.test');
console.log('Use the password supplied through DEMO_USER_PASSWORD.');
