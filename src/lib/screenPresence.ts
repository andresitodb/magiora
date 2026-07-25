import type { ProfilePreviewData } from '@/lib/profilePreview';
import { normalizeSectionOrder, type ScreenPresenceSectionId } from './profileTemplateSettings.ts';

export type ScreenPresenceSection = {
  id: string;
  label: string;
};

export function getScreenPresenceSections(
  data: ProfilePreviewData,
  configuredOrder?: ScreenPresenceSectionId[],
): ScreenPresenceSection[] {
  const hasCredits = data.experience.some((credit) =>
    credit.production || credit.title || credit.project
  );
  const hasPractice =
    data.skills.length > 0 ||
    data.languages.length > 0 ||
    (data.equipment ?? []).some((item) => item.category || item.items);
  const hasContact =
    Object.values(data.socialLinks).some((value) => value?.trim()) ||
    Boolean(data.contactEmail || data.websiteUrl);

  const available = [
    data.bio && { id: 'about', label: 'About' },
    data.gallery.length > 0 && { id: 'gallery', label: 'Gallery' },
    data.demoReelUrl && { id: 'reel', label: 'Reel' },
    data.projects.length > 0 && { id: 'work', label: 'Work' },
    hasCredits && { id: 'credits', label: 'Credits' },
    hasPractice && { id: 'practice', label: 'Practice' },
    data.recommendations.length > 0 && { id: 'recommendations', label: 'Recommendations' },
    hasContact && { id: 'contact', label: 'Contact' },
  ].filter(Boolean) as ScreenPresenceSection[];
  const order = normalizeSectionOrder(configuredOrder);
  return order.flatMap((id) => available.find((section) => section.id === id) ?? []);
}
