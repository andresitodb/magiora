// Service role client — bypasses RLS. Only use server-side.
// Used for:
//   - Writing to email_log (no user context)
//   - Computing matches across all users when a casting call publishes
//   - Other admin/system operations

import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for service client'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
