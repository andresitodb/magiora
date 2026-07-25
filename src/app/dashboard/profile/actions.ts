'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hasMemberEntitlement as hasPaidMembership } from '@/lib/memberEntitlementServer';
import { categoryForTitle, CUSTOM_FALLBACK_CATEGORY } from '@/lib/role_titles';
import { TEMPLATES, ACCENTS, DEFAULT_TEMPLATE, DEFAULT_ACCENT } from '@/lib/profile_themes';
import {
  type ExperienceRecord,
  preserveSubmittedExperience,
} from '@/lib/experienceReferences';
import {
  type ProfileVideoLink,
  retainMemberSelection,
  retainProfileSkills,
  retainProfileVideos,
} from '@/lib/profileMemberRetention';
import {
  isTypographyStyle,
  normalizeHiddenSections,
  normalizeSectionOrder,
  SCREEN_PRESENCE_SECTIONS,
} from '@/lib/profileTemplateSettings';
import { getSupportedAccents, getTemplate } from '@/lib/profile_themes';

const VALID_TEMPLATES = TEMPLATES.map((t) => t.id);
const VALID_ACCENTS = ACCENTS.map((a) => a.id);

export type TemplateSettingsSaveResult = {
  ok: boolean;
  message: string;
};

export async function saveTemplateSettings(
  payload: {
    templateId: string;
    paletteId: string;
    fontStyle: string;
    sectionOrder: unknown;
    hiddenSections?: unknown;
  },
): Promise<TemplateSettingsSaveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in to save template customization.' };
  if (!(await hasPaidMembership(user.id))) {
    return { ok: false, message: 'Template customization is available with Member.' };
  }

  const template = getTemplate(payload.templateId);
  const supportedPalette = getSupportedAccents(template.id)
    .some((palette) => palette.id === payload.paletteId);
  const submittedSectionsAreValid =
    Array.isArray(payload.sectionOrder) &&
    payload.sectionOrder.every((section) =>
      SCREEN_PRESENCE_SECTIONS.includes(section as (typeof SCREEN_PRESENCE_SECTIONS)[number])
    );
  if (
    template.id !== payload.templateId ||
    !supportedPalette ||
    !isTypographyStyle(payload.fontStyle) ||
    !submittedSectionsAreValid
  ) {
    return { ok: false, message: 'This template customization is not valid.' };
  }

  const sectionOrder = normalizeSectionOrder(payload.sectionOrder);
  const hiddenSections = normalizeHiddenSections(payload.hiddenSections);
  const { error } = await supabase.from('profile_template_settings').upsert({
    profile_id: user.id,
    template_id: template.id,
    palette_id: payload.paletteId,
    font_style: payload.fontStyle,
    section_order: sectionOrder,
    hidden_sections: hiddenSections,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id,template_id' });

  if (error) return { ok: false, message: 'Customization could not be saved.' };
  revalidatePath('/dashboard/profile');
  revalidatePath('/profile-preview');
  const { data: profile } = await supabase.from('profiles').select('slug').eq('id', user.id).single();
  if (profile?.slug) revalidatePath(`/m/${profile.slug}`);
  return { ok: true, message: 'Customization saved.' };
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

function sortExperienceByYear(items: ExperienceRecord[]): ExperienceRecord[] {
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
    .select('slug, experience, skills, video_links, profile_theme, profile_accent')
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

  const submittedTheme = formData.get('profile_theme') as string | null;
  const submittedAccent = formData.get('profile_accent') as string | null;
  const profileTheme = retainMemberSelection(
    existingProfile?.profile_theme,
    submittedTheme,
    VALID_TEMPLATES,
    isMember,
    DEFAULT_TEMPLATE,
  );
  const profileAccent = retainMemberSelection(
    existingProfile?.profile_accent,
    submittedAccent,
    VALID_ACCENTS,
    isMember,
    DEFAULT_ACCENT,
  );

  const languages = formData.getAll('languages').map(String).filter(Boolean);

  const submittedSkills = formData
    .getAll('skills')
    .map(String)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const skills = retainProfileSkills(
    existingProfile?.skills ?? [],
    submittedSkills,
    isMember,
  );

  const malformedFieldLabels: Record<string, string> = {
    video_links: 'video links',
    experience: 'experience',
    recommendations: 'recommendations',
    equipment: 'equipment',
    physical_details: 'professional details',
    social_links: 'social links',
    representation: 'representation',
  };

  const parseJSON = <T,>(
    key: string,
    fallback: T,
    expected: 'array' | 'object',
  ): T => {
    try {
      const raw = formData.get(key) as string | null;
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as unknown;
      const valid =
        expected === 'array'
          ? Array.isArray(parsed)
          : typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
      if (!valid) throw new Error('Unexpected JSON shape');
      return parsed as T;
    } catch {
      redirect(
        '/dashboard/profile?error=' +
          encodeURIComponent(
            `We could not read your ${malformedFieldLabels[key] ?? key}. Review that section and try again.`,
          ),
      );
    }
  };

  const submittedVideoLinks = parseJSON<ProfileVideoLink[]>(
    'video_links',
    [],
    'array',
  );
  const existingVideoLinks = Array.isArray(existingProfile?.video_links)
    ? existingProfile.video_links as ProfileVideoLink[]
    : [];
  const videoLinks = retainProfileVideos(
    existingVideoLinks,
    submittedVideoLinks,
    isMember,
  );

  const experienceRaw = parseJSON<ExperienceRecord[]>('experience', [], 'array');
  let experience: ExperienceRecord[];
  try {
    const existingExperience = Array.isArray(existingProfile?.experience)
      ? existingProfile.experience as ExperienceRecord[]
      : [];
    experience = sortExperienceByYear(
      preserveSubmittedExperience(experienceRaw, existingExperience)
    );
  } catch (error) {
    redirect(
      '/dashboard/profile?error=' +
        encodeURIComponent(
          error instanceof Error
            ? error.message
            : 'Review your experience references and try again.'
        )
    );
  }

  const recommendations = parseJSON('recommendations', [], 'array');
  const equipment = parseJSON('equipment', [], 'array');
  const physicalDetails = parseJSON('physical_details', {}, 'object');
  const socialLinks = parseJSON('social_links', {}, 'object');
  const representation = parseJSON('representation', {}, 'object');

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
