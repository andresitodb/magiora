'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeLocalRedirect } from '@/lib/safeRedirect';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = safeLocalRedirect(formData.get('next'), '/dashboard');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    );
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('display_name') as string;
  const plan = formData.get('plan') === 'member' ? 'member' : 'listed';
  const next = safeLocalRedirect(
    formData.get('next'),
    plan === 'member' ? '/pricing?plan=monthly' : '/dashboard'
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      `/signup?error=${encodeURIComponent(error.message)}&plan=${plan}&next=${encodeURIComponent(next)}`
    );
  }
  redirect(
    `/login?message=${encodeURIComponent('Check your email to confirm your account')}&next=${encodeURIComponent(next)}`
  );
}
