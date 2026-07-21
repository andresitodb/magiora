// Shared types and constants for the projects feature.

export type ProjectType =
  | 'feature_film'
  | 'short_film'
  | 'series'
  | 'pilot'
  | 'web_series'
  | 'music_video'
  | 'commercial'
  | 'documentary'
  | 'theater'
  | 'other';

export type ProjectStatus =
  | 'in_development'
  | 'pre_production'
  | 'in_production'
  | 'post_production'
  | 'completed'
  | 'released';

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'feature_film', label: 'Feature film' },
  { value: 'short_film', label: 'Short film' },
  { value: 'series', label: 'Series' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'web_series', label: 'Web series' },
  { value: 'music_video', label: 'Music video' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'theater', label: 'Theater' },
  { value: 'other', label: 'Other' },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'in_development', label: 'In development', color: 'bg-stone-100 text-stone-700' },
  { value: 'pre_production', label: 'Pre-production', color: 'bg-amber-50 text-amber-800' },
  { value: 'in_production', label: 'In production', color: 'bg-blue-50 text-blue-800' },
  { value: 'post_production', label: 'Post-production', color: 'bg-purple-50 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-50 text-green-800' },
  { value: 'released', label: 'Released', color: 'bg-[#FAECE7] text-[#712B13]' },
];

export function normalizeProjectType(value: FormDataEntryValue | null): ProjectType {
  const candidate = String(value ?? '');
  return PROJECT_TYPES.some((type) => type.value === candidate)
    ? candidate as ProjectType
    : 'feature_film';
}

export function normalizeProjectStatus(value: FormDataEntryValue | null): ProjectStatus {
  const candidate = String(value ?? '');
  return PROJECT_STATUSES.some((status) => status.value === candidate)
    ? candidate as ProjectStatus
    : 'in_development';
}

export function parseProjectYear(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const year = Number.parseInt(String(value), 10);
  const max = new Date().getFullYear() + 5;
  return Number.isInteger(year) && year >= 1900 && year <= max ? year : null;
}

export function isHttpProjectUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getProjectTypeLabel(value: string | null): string {
  if (!value) return 'Project';
  return PROJECT_TYPES.find((t) => t.value === value)?.label ?? value.replace('_', ' ');
}

export function getProjectStatusLabel(value: string | null): string {
  if (!value) return '';
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? value.replace('_', ' ');
}

export function getProjectStatusColor(value: string | null): string {
  if (!value) return 'bg-stone-100 text-stone-700';
  return PROJECT_STATUSES.find((s) => s.value === value)?.color ?? 'bg-stone-100 text-stone-700';
}

// Group credit categories for the public project page
export const CREDIT_GROUPS: { id: string; label: string; categories: string[] }[] = [
  { id: 'directing', label: 'Directing', categories: ['director'] },
  { id: 'writing', label: 'Writing', categories: ['writer'] },
  { id: 'cast', label: 'Cast', categories: ['actor'] },
  { id: 'producing', label: 'Producing', categories: ['producer'] },
  { id: 'cinematography', label: 'Cinematography', categories: ['cinematographer'] },
  { id: 'editing', label: 'Editing', categories: ['editor'] },
  { id: 'sound', label: 'Sound', categories: ['sound'] },
  { id: 'design', label: 'Design', categories: ['production_designer', 'costume', 'makeup_hair'] },
  { id: 'crew', label: 'Other crew', categories: ['crew_other'] },
];

export function groupCredits<T extends { role_category?: string | null }>(
  credits: T[]
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const group of CREDIT_GROUPS) out[group.id] = [];
  out['other'] = [];

  for (const credit of credits) {
    let placed = false;
    for (const group of CREDIT_GROUPS) {
      if (credit.role_category && group.categories.includes(credit.role_category)) {
        out[group.id].push(credit);
        placed = true;
        break;
      }
    }
    if (!placed) out['other'].push(credit);
  }

  return out;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
