// Matching engine — when a casting call is published, finds profiles
// that fit the criteria and writes rows to casting_call_matches.
//
// Score breakdown (max 100):
//   Role category match     — 30 points
//   Gender match            — 15 points  (or 'Any' = full credit)
//   Age in range            — 15 points  (only for actors)
//   City match              — 15 points
//   Language overlap        — 15 points
//   Verified bonus          — 10 points

import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail, castingMatchEmail } from '@/lib/email';

interface CastingCall {
  id: string;
  project_title: string;
  role_name: string;
  target_role_category: string;
  target_gender: string | null;
  target_age_min: number | null;
  target_age_max: number | null;
  location_city: string | null;
  posted_by: string;
}

interface Profile {
  id: string;
  display_name: string;
  role_category: string;
  role_categories: string[];
  gender: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
  location_city: string | null;
  languages: string[];
  verified: boolean;
  contact_email: string | null;
  notification_preferences: { matches?: boolean };
}

interface MatchResult {
  profile_id: string;
  score: number;
  reasons: string[];
  display_name: string;
  email: string | null;
  wants_notification: boolean;
}

const MIN_MATCH_SCORE = 45;

export async function computeMatchesForCall(callId: string): Promise<MatchResult[]> {
  const supabase = createServiceClient();

  const { data: call } = await supabase
    .from('casting_calls')
    .select(
      'id, project_title, role_name, target_role_category, target_gender, target_age_min, target_age_max, location_city, posted_by'
    )
    .eq('id', callId)
    .maybeSingle();

  if (!call) return [];

  // Find candidate profiles: must match role_category in role_categories OR role_category itself,
  // be visible+approved, and not the poster themselves
  let query = supabase
    .from('profiles')
    .select(
      'id, display_name, role_category, role_categories, gender, age_range_min, age_range_max, location_city, languages, verified, contact_email, notification_preferences'
    )
    .eq('visible', true)
    .eq('approved', true)
    .neq('id', call.posted_by);

  // Match by role_category (primary OR in role_categories array)
  query = query.or(
    `role_category.eq.${call.target_role_category},role_categories.cs.{${call.target_role_category}}`
  );

  const { data: profiles } = await query;
  if (!profiles) return [];

  const matches: MatchResult[] = [];

  for (const profile of profiles as Profile[]) {
    const { score, reasons } = scoreMatch(call as CastingCall, profile);

    if (score < MIN_MATCH_SCORE) continue;

    matches.push({
      profile_id: profile.id,
      score,
      reasons,
      display_name: profile.display_name,
      email: profile.contact_email,
      wants_notification: profile.notification_preferences?.matches !== false,
    });
  }

  // Save to DB (upsert — if a match already exists, update score/reasons)
  if (matches.length > 0) {
    await supabase.from('casting_call_matches').upsert(
      matches.map((m) => ({
        casting_call_id: call.id,
        profile_id: m.profile_id,
        score: m.score,
        reasons: m.reasons,
      })),
      { onConflict: 'casting_call_id,profile_id' }
    );
  }

  return matches;
}

function scoreMatch(
  call: CastingCall,
  profile: Profile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Role category match: 30 points
  if (
    profile.role_category === call.target_role_category ||
    profile.role_categories?.includes(call.target_role_category)
  ) {
    score += 30;
    reasons.push(`You list ${call.target_role_category.replace('_', ' ')} as one of your roles`);
  }

  // Gender: 15 points (or 'Any' = full credit)
  if (!call.target_gender || call.target_gender === 'Any') {
    score += 15;
  } else if (profile.gender === call.target_gender) {
    score += 15;
    reasons.push('Gender matches the role');
  }

  // Age range: 15 points (only for actors)
  if (call.target_role_category === 'actor' && call.target_age_min && call.target_age_max) {
    if (profile.age_range_min && profile.age_range_max) {
      const overlapMin = Math.max(call.target_age_min, profile.age_range_min);
      const overlapMax = Math.min(call.target_age_max, profile.age_range_max);
      if (overlapMin <= overlapMax) {
        score += 15;
        reasons.push(
          `Your age range overlaps the role (${overlapMin}-${overlapMax})`
        );
      }
    }
  } else if (call.target_role_category !== 'actor') {
    score += 15; // not applicable
  }

  // City match: 15 points
  if (call.location_city && profile.location_city) {
    const callCity = call.location_city.toLowerCase().trim();
    const profileCity = profile.location_city.toLowerCase().trim();
    if (callCity === profileCity || callCity.includes(profileCity) || profileCity.includes(callCity)) {
      score += 15;
      reasons.push(`You're based in ${profile.location_city}`);
    }
  } else if (!call.location_city) {
    score += 15; // remote / unspecified
  }

  // Language overlap: 15 points (English assumed if no language specified on call)
  if (profile.languages && profile.languages.length > 0) {
    if (profile.languages.includes('en') || profile.languages.includes('es')) {
      score += 15;
    }
  }

  // Verified bonus: 10 points
  if (profile.verified) {
    score += 10;
  }

  return { score, reasons };
}

// Notify matched profiles via in-app notification + email
export async function notifyMatchedProfiles(
  callId: string,
  matches: MatchResult[]
): Promise<{ notified: number; emailed: number; skipped: number }> {
  if (matches.length === 0) return { notified: 0, emailed: 0, skipped: 0 };

  const supabase = createServiceClient();

  const { data: call } = await supabase
    .from('casting_calls')
    .select('id, project_title, role_name')
    .eq('id', callId)
    .maybeSingle();

  if (!call) return { notified: 0, emailed: 0, skipped: 0 };

  let emailed = 0;
  let skipped = 0;

  // In-app notifications for ALL matches
  const notifs = matches.map((m) => ({
    recipient_id: m.profile_id,
    type: 'casting_call_match',
    payload: {
      title: `Match: ${call.project_title}`,
      body: `${call.role_name} · ${m.reasons.slice(0, 2).join(' · ')}`,
      related_id: call.id,
    },
  }));

  await supabase.from('notifications').insert(notifs);
  await supabase
    .from('casting_call_matches')
    .update({ notified_at: new Date().toISOString() })
    .eq('casting_call_id', call.id);

  // Email only the top 10 matches (avoid spamming on first publish)
  const topMatches = matches
    .filter((m) => m.wants_notification && m.email)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  for (const match of topMatches) {
    const { subject, html } = castingMatchEmail(
      match.display_name,
      call.project_title,
      call.role_name,
      match.reasons,
      call.id
    );
    const result = await sendEmail({
      to: match.email!,
      template: 'casting_match',
      subject,
      html,
      relatedId: call.id,
    });
    if (result.status === 'sent') emailed++;
    else skipped++;
  }

  return { notified: matches.length, emailed, skipped };
}
