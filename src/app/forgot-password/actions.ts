'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    }/reset-password`,
  });

  // We don't reveal whether the email exists — always show the same "sent" message.
  if (error && !error.message.toLowerCase().includes('not found')) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/forgot-password?sent=1');
}
