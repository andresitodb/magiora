import { cookies } from 'next/headers';
import en from '@/messages/en.json';
import es from '@/messages/es.json';

export type Locale = 'en' | 'es';
const messagesByLocale = { en, es };

const COOKIE_NAME = 'kinora_locale';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(COOKIE_NAME)?.value;
  return stored === 'es' ? 'es' : 'en';
}

// Server-side: call from a Server Component to get a translator function.
export async function getT() {
  const locale = await getLocale();
  const messages = messagesByLocale[locale];

  return function t(key: string): string {
    const parts = key.split('.');
    let value: unknown = messages;
    for (const p of parts) {
      if (value && typeof value === 'object' && p in value) {
        value = (value as Record<string, unknown>)[p];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };
}

// Returns full messages object for passing to client components.
export async function getMessages() {
  const locale = await getLocale();
  return { locale, messages: messagesByLocale[locale] };
}
