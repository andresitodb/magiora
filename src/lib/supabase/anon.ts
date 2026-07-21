import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from '@/lib/environment';

export function createAnonClient() {
  const config = getPublicSupabaseConfig();
  return createSupabaseClient(
    config.url,
    config.anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
