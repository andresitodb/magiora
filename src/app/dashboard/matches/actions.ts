'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function dismissMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const matchId = formData.get('match_id') as string;

  await supabase
    .from('casting_call_matches')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('profile_id', user.id);

  revalidatePath('/dashboard/matches');
}
