export function applyPublicBrand(
  value: string | null | undefined,
  contentKind: 'system' | 'user' = 'user'
): string {
  if (!value || contentKind === 'user') return value ?? '';

  return value
    .replace(/\bKinora\b/g, 'Magiora')
    .replace(/\bkinora\.com\b/gi, 'magiora.com');
}
