export type ExperienceReferenceType = 'imdb' | 'official';

export type ExperienceReferenceValidation =
  | { valid: true; normalizedUrl: string }
  | { valid: false; error: string };

export type ExperienceRecord = {
  year?: string | number | null;
  production?: string;
  role?: string;
  description?: string;
  reference_type?: ExperienceReferenceType | 'legacy' | string;
  reference_url?: string;
  title?: string;
  project?: string;
  project_type?: string;
  link?: string;
  [key: string]: unknown;
};

const IMDB_HOSTNAMES = new Set([
  'imdb.com',
  'www.imdb.com',
  'm.imdb.com',
  'pro.imdb.com',
]);

const BLOCKED_OFFICIAL_HOSTS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
];

export const INVALID_IMDB_MESSAGE = 'Enter a valid IMDb URL.';
export const INVALID_OFFICIAL_WEBSITE_MESSAGE =
  'Portfolio videos belong in the Portfolio section. Experience only accepts IMDb or official production websites.';

function parseWebUrl(value: string): URL | null {
  try {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
    if (
      !url.hostname ||
      (!url.hostname.includes('.') && url.hostname !== 'localhost') ||
      /\s/.test(url.hostname)
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function hostnameMatches(hostname: string, blockedHost: string) {
  return hostname === blockedHost || hostname.endsWith(`.${blockedHost}`);
}

export function validateExperienceReference(
  type: ExperienceReferenceType,
  value: string,
): ExperienceReferenceValidation {
  const url = parseWebUrl(value);
  if (!url) {
    return {
      valid: false,
      error: type === 'imdb' ? INVALID_IMDB_MESSAGE : INVALID_OFFICIAL_WEBSITE_MESSAGE,
    };
  }

  if (type === 'imdb') {
    return IMDB_HOSTNAMES.has(url.hostname)
      ? { valid: true, normalizedUrl: url.toString() }
      : { valid: false, error: INVALID_IMDB_MESSAGE };
  }

  const blocked = BLOCKED_OFFICIAL_HOSTS.some((host) =>
    hostnameMatches(url.hostname, host)
  );
  return blocked
    ? { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE }
    : { valid: true, normalizedUrl: url.toString() };
}

export function inferExperienceReferenceType(
  value: string,
): ExperienceReferenceType | 'legacy' {
  if (validateExperienceReference('imdb', value).valid) return 'imdb';
  if (validateExperienceReference('official', value).valid) return 'official';
  return 'legacy';
}

export function normalizeExperienceForEditor(record: ExperienceRecord): ExperienceRecord {
  const existingReference = String(record.reference_url ?? record.link ?? '').trim();
  const inferredType = existingReference
    ? inferExperienceReferenceType(existingReference)
    : undefined;
  const referenceType =
    record.reference_type === 'imdb' || record.reference_type === 'official'
      ? record.reference_type
      : inferredType;

  return {
    ...record,
    production: String(record.production ?? record.title ?? ''),
    role: String(record.role ?? ''),
    description: String(
      record.description ??
      (record.title && record.project && record.project !== record.title ? record.project : '')
    ),
    reference_type: referenceType,
    reference_url:
      referenceType === 'imdb' || referenceType === 'official'
        ? existingReference
        : undefined,
  };
}

export function getExperienceReferencePresentation(record: ExperienceRecord): {
  href: string;
  label: 'View on IMDb' | 'Official website';
} | null {
  const value = String(record.reference_url ?? record.link ?? '').trim();
  if (!value) return null;

  const type =
    record.reference_type === 'imdb' || record.reference_type === 'official'
      ? record.reference_type
      : inferExperienceReferenceType(value);
  if (type === 'legacy') return null;

  const validation = validateExperienceReference(type, value);
  if (!validation.valid) return null;
  return {
    href: validation.normalizedUrl,
    label: type === 'imdb' ? 'View on IMDb' : 'Official website',
  };
}

export function getLegacyExperienceReference(record: ExperienceRecord): string | null {
  const legacyUrl = String(record.link ?? '').trim();
  if (!legacyUrl || inferExperienceReferenceType(legacyUrl) !== 'legacy') return null;

  const replacementType =
    record.reference_type === 'imdb' || record.reference_type === 'official'
      ? record.reference_type
      : null;
  const replacementUrl = String(record.reference_url ?? '').trim();
  if (replacementType && replacementUrl) {
    const replacement = validateExperienceReference(replacementType, replacementUrl);
    if (replacement.valid) return null;
  }
  return legacyUrl;
}

export function preserveSubmittedExperience(
  submitted: ExperienceRecord[],
  existing: ExperienceRecord[],
): ExperienceRecord[] {
  const existingLegacyLinks = new Set(
    existing
      .map((record) => String(record.link ?? '').trim())
      .filter((link) => link && inferExperienceReferenceType(link) === 'legacy')
  );

  return submitted.map((record) => {
    const referenceType =
      record.reference_type === 'imdb' || record.reference_type === 'official'
        ? record.reference_type
        : null;
    const referenceUrl = String(record.reference_url ?? '').trim();

    if (referenceUrl && !referenceType) {
      throw new Error(INVALID_OFFICIAL_WEBSITE_MESSAGE);
    }

    if (referenceType && referenceUrl) {
      const validation = validateExperienceReference(referenceType, referenceUrl);
      if (!validation.valid) throw new Error(validation.error);
      const withoutLegacyLink = { ...record };
      delete withoutLegacyLink.link;
      return {
        ...withoutLegacyLink,
        reference_type: referenceType,
        reference_url: validation.normalizedUrl,
      };
    }

    const legacyLink = String(record.link ?? '').trim();
    if (legacyLink && !existingLegacyLinks.has(legacyLink)) {
      throw new Error(INVALID_OFFICIAL_WEBSITE_MESSAGE);
    }
    return record;
  });
}
