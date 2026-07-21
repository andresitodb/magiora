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
