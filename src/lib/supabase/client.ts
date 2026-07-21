import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseConfig } from '@/lib/environment';

export function createClient() {
  const config = getPublicSupabaseConfig();
  return createBrowserClient(
    config.url,
    config.anonKey
  );
}
