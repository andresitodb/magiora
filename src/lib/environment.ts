export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

export function parsePublicSupabaseConfig(
  url: string | undefined,
  anonKey: string | undefined
): PublicSupabaseConfig {
  const cleanUrl = url?.trim() ?? '';
  const cleanKey = anonKey?.trim() ?? '';
  const missing = [
    !cleanUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !cleanKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required public configuration: ${missing.join(', ')}`);
  }

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be an absolute HTTPS or localhost URL');
  }

  return { url: cleanUrl, anonKey: cleanKey };
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  return parsePublicSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

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
