export type EmailConfigState =
  | { status: 'disabled' }
  | { status: 'broken'; issues: string[] }
  | { status: 'enabled'; apiKey: string; from: string; siteUrl: string };

export function inspectEmailConfig(
  apiKey: string | undefined,
  from: string | undefined,
  siteUrl: string | undefined
): EmailConfigState {
  const cleanKey = apiKey?.trim() ?? '';
  if (!cleanKey) return { status: 'disabled' };

  const cleanFrom = from?.trim() ?? '';
  const cleanSiteUrl = siteUrl?.trim() ?? '';
  const issues: string[] = [];
  if (!/^re_[A-Za-z0-9_]+$/.test(cleanKey)) {
    issues.push('RESEND_API_KEY has an invalid format');
  }
  if (!/^.+\s<[^<>\s]+@[^<>\s]+\.[^<>\s]+>$/.test(cleanFrom)) {
    issues.push('EMAIL_FROM must use "Name <email@example.com>" format');
  }
  try {
    const parsed = new URL(cleanSiteUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      issues.push('NEXT_PUBLIC_SITE_URL must use HTTPS or localhost');
    }
  } catch {
    issues.push('NEXT_PUBLIC_SITE_URL must be an absolute URL');
  }

  return issues.length > 0
    ? { status: 'broken', issues }
    : { status: 'enabled', apiKey: cleanKey, from: cleanFrom, siteUrl: cleanSiteUrl };
}
