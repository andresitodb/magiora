'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setLocaleCookie(locale: 'en' | 'es') {
  const cookieStore = await cookies();
  cookieStore.set('magiora_locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  revalidatePath('/', 'layout');
}
