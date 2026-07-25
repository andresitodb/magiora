import type { DashboardCompleteness } from '@/lib/dashboardFoundation';

export const PROFILE_CHAPTERS = [
  {
    id: 'profile-essentials',
    label: 'Profile essentials',
    itemKeys: ['portrait', 'name', 'role', 'location', 'bio'],
  },
  {
    id: 'professional-practice',
    label: 'Professional practice',
    itemKeys: ['languages', 'skills'],
  },
  {
    id: 'work',
    label: 'Work',
    itemKeys: ['portfolio', 'credits'],
  },
  {
    id: 'contact-chapter',
    label: 'Contact',
    itemKeys: ['links'],
  },
  {
    id: 'public-presence',
    label: 'Public presence',
    itemKeys: [],
  },
  {
    id: 'trust-account',
    label: 'Trust & account',
    itemKeys: [],
  },
] as const;

export type ProfileChapterId = (typeof PROFILE_CHAPTERS)[number]['id'];

export function getChapterProgress(
  completeness: DashboardCompleteness,
) {
  return PROFILE_CHAPTERS.map((chapter) => {
    const items = completeness.items.filter((item) =>
      chapter.itemKeys.some((key) => key === item.key),
    );
    const completed = items.filter((item) => item.complete).length;
    return {
      id: chapter.id,
      label: chapter.label,
      completed,
      total: items.length,
      percent: items.length > 0 ? Math.round((completed / items.length) * 100) : null,
    };
  });
}

export type PublicProfileStatus = 'Public' | 'Private' | 'Awaiting approval';

export function getProfilePublicStatus(
  visible: boolean | null | undefined,
  approved: boolean | null | undefined,
): PublicProfileStatus {
  if (!approved) return 'Awaiting approval';
  return visible ? 'Public' : 'Private';
}

export function shouldTrackProfileChange({
  formId,
  autoSaved,
}: {
  formId: string | null;
  autoSaved: boolean;
}) {
  return formId === 'profile-form' && !autoSaved;
}

export function shouldWarnForUnsavedChanges({
  dirty,
  submitting,
  destination,
}: {
  dirty: boolean;
  submitting: boolean;
  destination?: string | null;
}) {
  if (!dirty || submitting) return false;
  if (destination?.startsWith('#') || destination?.startsWith('/dashboard/profile#')) {
    return false;
  }
  return true;
}

export function getValidationTarget(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('role')) return 'roles';
  if (normalized.includes('display name')) return 'display_name';
  if (normalized.includes('playing age')) return 'roles';
  if (normalized.includes('demo reel') || normalized.includes('video')) return 'portfolio';
  if (normalized.includes('website') || normalized.includes('social') || normalized.includes('representation')) {
    return 'contact';
  }
  if (normalized.includes('link format') || normalized.includes('taken')) return 'public-presence';
  if (normalized.includes('language')) return 'languages';
  if (normalized.includes('skill')) return 'skills';
  if (normalized.includes('experience') || normalized.includes('credit')) return 'experience';
  if (normalized.includes('recommendation')) return 'recommendations';
  if (normalized.includes('equipment')) return 'equipment';
  return null;
}

export function validationSummary(error: string | null | undefined) {
  if (!error) return null;
  return {
    title: 'Your profile was not saved',
    message: error,
    target: getValidationTarget(error),
  };
}

export type MemberSaveIntent = {
  isMember: boolean;
  currentSlug: string;
  requestedSlug: string;
  requestedTheme: string;
  requestedAccent: string;
  currentSkillCount: number;
  skillCount: number;
};

export function getRequestedMemberFeatures({
  isMember,
  currentSlug,
  requestedSlug,
  requestedTheme,
  requestedAccent,
  currentSkillCount,
  skillCount,
}: MemberSaveIntent) {
  if (isMember) return [];

  const features: string[] = [];
  if (requestedSlug.trim() !== currentSlug.trim()) {
    features.push('Custom profile URL');
  }
  if (requestedTheme !== 'editorial') {
    features.push('Profile theme');
  }
  if (requestedAccent !== 'coral') {
    features.push('Color palette');
  }
  if (skillCount > Math.max(5, currentSkillCount)) {
    features.push('Additional skills');
  }
  return features;
}
