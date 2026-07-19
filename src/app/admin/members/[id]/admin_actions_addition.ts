// ============================================================
// PEGAR ESTO AL FINAL de tu archivo:
//   src/app/admin/members/[id]/actions.ts
//
// (si ese archivo no existe, creá uno nuevo con TODO este contenido,
//  incluyendo el 'use server' de arriba)
// ============================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function toggleFeatured(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify admin
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) redirect('/');

  const profileId = formData.get('profile_id') as string;
  const action = formData.get('action') as string; // 'feature' or 'unfeature'

  if (action === 'feature') {
    await supabase
      .from('profiles')
      .update({ featured_at: new Date().toISOString() })
      .eq('id', profileId);
  } else {
    await supabase
      .from('profiles')
      .update({ featured_at: null })
      .eq('id', profileId);
  }

  revalidatePath(`/admin/members/${profileId}`);
  revalidatePath('/');
  redirect(`/admin/members/${profileId}?toast=updated`);
}
