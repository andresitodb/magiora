import type { ProfilePreviewData } from '@/lib/profilePreview';
import type { AccentId, TemplateId } from '@/lib/profile_themes';

export const PROFILE_TEMPLATE_PREVIEW_STORAGE_KEY =
  'magiora:profile-template-preview';

export type ProfileTemplatePreviewPayload = {
  template: TemplateId;
  accent: AccentId;
  data: ProfilePreviewData;
};
