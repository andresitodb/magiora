'use server';

import { createAnonClient } from '@/lib/supabase/anon';

export async function signUpNewsletter(
  email: string
): Promise<{ status: 'success' | 'error' | 'duplicate'; message: string }> {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', message: "That doesn't look like a valid email." };
  }

  const supabase = createAnonClient();
  const { error } = await supabase
    .from('newsletter_signups')
    .insert({ email: email.toLowerCase(), source: 'home_footer' });

  if (error) {
    if (error.code === '23505') {
      return { status: 'duplicate', message: "You're already on the list." };
    }
    return { status: 'error', message: 'Something went wrong. Try again?' };
  }

  return { status: 'success', message: 'You\u2019re on the list. Watch your inbox.' };
}
