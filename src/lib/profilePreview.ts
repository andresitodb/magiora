export type PreviewCredit = {
  year?: string;
  title?: string;
  project?: string;
  role?: string;
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
