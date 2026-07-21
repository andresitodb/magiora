export type Locale = 'en' | 'es';

export function resolveLocale(
  currentLocale: string | undefined,
  legacyLocale: string | undefined
): Locale {
  const stored = currentLocale ?? legacyLocale;
  return stored === 'es' ? 'es' : 'en';
}
