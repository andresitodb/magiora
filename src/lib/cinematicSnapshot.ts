import type { ProfilePreviewData } from '@/lib/profilePreview';

export type CareerSnapshotMetric = {
  id: 'projects' | 'credits' | 'gallery' | 'roles';
  label: string;
  value: number;
};

const normalized = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase() ?? '';

export function getCinematicCareerSnapshot(data: ProfilePreviewData): CareerSnapshotMetric[] {
  const projects = new Set(data.projects.map((item) => normalized(item.slug) || normalized(item.title)).filter(Boolean));
  const credits = new Set(data.experience.map((item) => [
    normalized(item.production || item.title || item.project),
    normalized(item.role),
    String(item.year ?? ''),
  ].join('|')).filter((key) => key !== '||'));
  const gallery = new Set(data.gallery.map(normalized).filter(Boolean));
  const roles = new Set(data.roles.map(normalized).filter(Boolean));

  return [
    { id: 'projects', label: 'Projects', value: projects.size },
    { id: 'credits', label: 'Credits', value: credits.size },
    { id: 'gallery', label: 'Gallery', value: gallery.size },
    { id: 'roles', label: 'Roles', value: roles.size },
  ].filter((metric) => metric.value > 0) as CareerSnapshotMetric[];
}

export function getShortBiography(biography: string, maximumLength = 280) {
  const text = biography.trim().replace(/\s+/g, ' ');
  if (text.length <= maximumLength) return text;
  const candidate = text.slice(0, maximumLength + 1);
  const finalSpace = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, finalSpace > 0 ? finalSpace : maximumLength).trim()}…`;
}
