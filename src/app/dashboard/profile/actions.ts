'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hasPaidMembership } from '@/lib/billingServer';
import { categoryForTitle, CUSTOM_FALLBACK_CATEGORY } from '@/lib/role_titles';
import { TEMPLATES, ACCENTS, DEFAULT_TEMPLATE, DEFAULT_ACCENT } from '@/lib/profile_themes';

const FREE_SKILL_LIMIT = 5;
const VALID_TEMPLATES = TEMPLATES.map((t) => t.id);
const VALID_ACCENTS = ACCENTS.map((a) => a.id);

interface ExperienceItem {
  year?: string | number | null;
  [key: string]: unknown;
}

interface VideoLink {
  url?: string;
  [key: string]: unknown;
}

function optionalHttpUrl(value: FormDataEntryValue | null): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? text : null;
  } catch {
    return null;
  }
}

function sortExperienceByYear(items: ExperienceItem[]): ExperienceItem[] {
  return [...items].sort((a, b) => {
    const ay = parseInt(String(a.year ?? ''));
    const by = parseInt(String(b.year ?? ''));
    const aValid = !isNaN(ay);
    const bValid = !isNaN(by);
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    return by - ay;
  });
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('slug')
    .eq('id', user.id)
    .single();
  const isMember = await hasPaidMembership(user.id);

  const roleTitles = formData
    .getAll('role_titles')
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  if (roleTitles.length === 0) {
    redirect('/dashboard/profile?error=' + encodeURIComponent('Please select at least one role'));
  }

  const primaryCategory = categoryForTitle(roleTitles[0]) ?? CUSTOM_FALLBACK_CATEGORY;
  const roleCategories = Array.from(
    new Set(roleTitles.map((t) => categoryForTitle(t) ?? CUSTOM_FALLBACK_CATEGORY))
  );
  const customRoleLabel =
    categoryForTitle(roleTitles[0]) === null ? roleTitles[0] : null;

  let newSlug = existingProfile?.slug ?? '';
  if (isMember) {
    const submittedSlug = (formData.get('slug') as string | null)?.trim() ?? '';
    if (submittedSlug && submittedSlug !== existingProfile?.slug) {
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(submittedSlug)) {
        redirect('/dashboard/profile?error=' + encodeURIComponent('Invalid link format'));
      }
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', submittedSlug)
        .neq('id', user.id)
        .maybeSingle();
      if (taken) {
        redirect('/dashboard/profile?error=' + encodeURIComponent('That link is already taken'));
      }
      newSlug = submittedSlug;
    }
  }

  let profileTheme = DEFAULT_TEMPLATE as string;
  let profileAccent = DEFAULT_ACCENT as string;
  if (isMember) {
    const submittedTheme = formData.get('profile_theme') as string | null;
    const submittedAccent = formData.get('profile_accent') as string | null;
    if (submittedTheme && VALID_TEMPLATES.some((theme) => theme === submittedTheme)) {
      profileTheme = submittedTheme;
    }
    if (submittedAccent && VALID_ACCENTS.some((accent) => accent === submittedAccent)) {
      profileAccent = submittedAccent;
    }
  }

  const languages = formData.getAll('languages').map(String).filter(Boolean);

  let skills = formData.getAll('skills').map(String).map((s) => s.trim()).filter(Boolean);
  if (!isMember && skills.length > FREE_SKILL_LIMIT) skills = skills.slice(0, FREE_SKILL_LIMIT);

  const parseJSON = <T,>(key: string, fallback: T): T => {
    try {
      const raw = formData.get(key) as string | null;
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  let videoLinks: VideoLink[] = [];
  if (isMember) {
    videoLinks = parseJSON<VideoLink[]>('video_links', []).filter((link) =>
      link.url?.trim()
    );
  }

  const experienceRaw = parseJSON<ExperienceItem[]>('experience', []);
  const experience = sortExperienceByYear(experienceRaw);

  const recommendations = parseJSON('recommendations', []);
  const equipment = parseJSON('equipment', []);
  const physicalDetails = parseJSON('physical_details', {});
  const socialLinks = parseJSON('social_links', {});
  const representation = parseJSON('representation', {});

  const ageMin = formData.get('age_range_min') as string | null;
  const ageMax = formData.get('age_range_max') as string | null;
  const gender = formData.get('gender') as string | null;
  const parsedAgeMin = ageMin ? Number.parseInt(ageMin, 10) : null;
  const parsedAgeMax = ageMax ? Number.parseInt(ageMax, 10) : null;
  const displayName = String(formData.get('display_name') ?? '').trim();
  const demoReelRaw = formData.get('demo_reel_url');
  const websiteRaw = formData.get('website_url');
  const demoReelUrl = optionalHttpUrl(demoReelRaw);
  const websiteUrl = optionalHttpUrl(websiteRaw);

  if (!displayName) {
    redirect(
      '/dashboard/profile?error=' +
        encodeURIComponent('Display name is required')
    );
  }
  if (
    parsedAgeMin !== null &&
    parsedAgeMax !== null &&
    parsedAgeMax < parsedAgeMin
  ) {
    redirect(
      '/dashboard/profile?error=' +
        encodeURIComponent('Maximum playing age cannot be lower than minimum age')
    );
  }
  if (typeof demoReelRaw === 'string' && demoReelRaw.trim() && !demoReelUrl) {
    redirect(
      '/dashboard/profile?error=' +
        encodeURIComponent('Demo reel must be a valid http:// or https:// URL')
    );
  }
  if (typeof websiteRaw === 'string' && websiteRaw.trim() && !websiteUrl) {
    redirect(
      '/dashboard/profile?error=' +
        encodeURIComponent('Website must be a valid http:// or https:// URL')
    );
  }

  const updates = {
    display_name: displayName,
    slug: newSlug,
    role_titles: roleTitles,
    role_category: primaryCategory,
    role_categories: roleCategories,
    custom_role_label: customRoleLabel,
    bio: (formData.get('bio') as string) || null,
    location_city: (formData.get('location_city') as string) || null,
    location_state: (formData.get('location_state') as string) || null,
    languages,
    skills,
    demo_reel_url: demoReelUrl,
    video_links: videoLinks,
    experience,
    recommendations,
    equipment,
    physical_details: physicalDetails,
    social_links: socialLinks,
    representation,
    contact_email: (formData.get('contact_email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    website_url: websiteUrl,
    profile_theme: profileTheme,
    profile_accent: profileAccent,
    visible: formData.get('visible') === 'true',
    gender: gender || null,
    age_range_min: parsedAgeMin,
    age_range_max: parsedAgeMax,
  };

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (error) {
    redirect('/dashboard/profile?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/dashboard/profile');
  revalidatePath('/m/[slug]', 'page');
  redirect('/dashboard/profile?toast=saved');
}

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean; reason?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { available: false, reason: 'not_authed' };

  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
    return { available: false, reason: 'invalid' };
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', slug)
    .neq('id', user.id)
    .maybeSingle();

  return { available: !data };
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (newPassword !== confirmPassword) {
    redirect(`/dashboard/profile?error=${encodeURIComponent('Passwords do not match')}`);
  }
  if (newPassword.length < 6) {
    redirect(`/dashboard/profile?error=${encodeURIComponent('Password must be at least 6 characters')}`);
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/dashboard/profile?toast=password');
}

// ============================================================
// VERIFIED SELF-REQUEST
// ============================================================

export async function requestVerified(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const imdbUrl = (formData.get('imdb_url') as string)?.trim();
  const creditUrls = formData
    .getAll('credit_url')
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
  const idPhotoUrl = (formData.get('id_photo_url') as string)?.trim();
  const note = (formData.get('note') as string)?.trim() || null;

  if (!imdbUrl) {
    redirect('/dashboard/profile?error=' + encodeURIComponent('IMDb URL is required'));
  }
  if (creditUrls.length === 0) {
    redirect('/dashboard/profile?error=' + encodeURIComponent('At least one credit URL is required'));
  }
  if (!idPhotoUrl) {
    redirect('/dashboard/profile?error=' + encodeURIComponent('Please upload your ID photo'));
  }

  const verificationData = {
    imdb_url: imdbUrl,
    credit_urls: creditUrls,
    id_photo_url: idPhotoUrl,
    note,
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'pending',
      verification_data: verificationData,
    })
    .eq('id', user.id);

  if (error) {
    redirect('/dashboard/profile?error=' + encodeURIComponent(error.message));
  }

  // Notify all admins
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true);

  if (admins && admins.length > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    await supabase.from('notifications').insert(
      admins.map((a) => ({
        recipient_id: a.id,
        type: 'verification_request',
        payload: {
          title: 'New verification request',
          body: `${profile?.display_name ?? 'A user'} requested verified status.`,
          related_id: user.id,
        },
      }))
    );
  }

  revalidatePath('/dashboard/profile');
  revalidatePath('/admin/verifications');
  redirect('/dashboard/profile?toast=verified_submitted');
}
