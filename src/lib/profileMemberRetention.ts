export const FREE_PROFILE_SKILL_LIMIT = 5;

export type ProfileVideoLink = {
  label?: string;
  url?: string;
  [key: string]: unknown;
};

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function retainProfileSkills(
  existing: string[],
  submitted: string[],
  isMember: boolean,
) {
  const normalizedSubmitted = uniqueNonEmpty(submitted);
  if (isMember) return normalizedSubmitted;

  const activeSubmitted = normalizedSubmitted.slice(0, FREE_PROFILE_SKILL_LIMIT);
  const preservedExisting = uniqueNonEmpty(existing).filter(
    (skill) => !activeSubmitted.includes(skill)
  );
  return [...activeSubmitted, ...preservedExisting];
}

export function getActiveProfileSkills(skills: string[], isMember: boolean) {
  return isMember ? skills : skills.slice(0, FREE_PROFILE_SKILL_LIMIT);
}

export function retainProfileVideos(
  existing: ProfileVideoLink[],
  submitted: ProfileVideoLink[],
  isMember: boolean,
) {
  if (!isMember) return existing;
  return submitted.filter((link) => String(link.url ?? '').trim());
}

export function getActiveProfileVideos(
  videos: ProfileVideoLink[],
  isMember: boolean,
) {
  return isMember ? videos : [];
}

export function retainMemberSelection(
  existing: string | null | undefined,
  submitted: string | null | undefined,
  allowedValues: string[],
  isMember: boolean,
  fallback: string,
) {
  if (!isMember) return existing || fallback;
  return submitted && allowedValues.includes(submitted) ? submitted : existing || fallback;
}
