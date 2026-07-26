export type PreviewCredit = {
  year?: string | number | null;
  production?: string;
  title?: string;
  project?: string;
  role?: string;
  description?: string;
  reference_type?: string;
  reference_url?: string;
  link?: string;
};

export type PreviewRecommendation = {
  from_name?: string;
  from_role?: string;
  quote?: string;
};

export type PreviewProject = {
  title: string;
  tagline?: string | null;
  poster_url?: string | null;
  slug?: string | null;
  year?: number | null;
  creditRoles?: string[];
  creditRole?: string | null;
  role?: string | null;
  description?: string | null;
  reference_url?: string | null;
  reference_type?: 'imdb' | 'official' | null;
  project_type?: string | null;
  featured_at?: string | null;
};

export function aggregatePreviewProjects(projects: PreviewProject[]): PreviewProject[] {
  const aggregated = new Map<string, PreviewProject>();
  for (const project of projects) {
    const key = project.slug || project.title.trim().toLowerCase();
    const roles = [...(project.creditRoles ?? []), project.creditRole, project.role]
      .map((role) => role?.trim())
      .filter((role): role is string => Boolean(role));
    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, { ...project, creditRoles: Array.from(new Set(roles)) });
      continue;
    }
    existing.creditRoles = Array.from(new Set([...(existing.creditRoles ?? []), ...roles]));
  }
  return [...aggregated.values()];
}

export type PreviewEquipment = {
  category?: string;
  items?: string;
};

export type ProfilePreviewData = {
  headshotUrl: string | null;
  displayName: string;
  roles: string[];
  city: string;
  state: string;
  bio: string;
  languages: string[];
  skills: string[];
  demoReelUrl: string;
  gallery: string[];
  experience: PreviewCredit[];
  projects: PreviewProject[];
  recommendations: PreviewRecommendation[];
  socialLinks: Record<string, string>;
  equipment?: PreviewEquipment[];
  contactEmail?: string;
  websiteUrl?: string;
  phone?: string;
  country?: string;
  heroImageUrl?: string | null;
  videoLinks?: { label: string; url: string }[];
  representation?: {
    agency?: string;
    manager?: string;
    agent?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
};

export type ProfilePreviewPatch = Partial<ProfilePreviewData>;

export function mergeProfilePreviewData(
  stored: ProfilePreviewData,
  local: ProfilePreviewPatch
): ProfilePreviewData {
  return {
    ...stored,
    ...Object.fromEntries(
      Object.entries(local).filter(([, value]) => value !== undefined)
    ),
  } as ProfilePreviewData;
}

export function parsePreviewJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
