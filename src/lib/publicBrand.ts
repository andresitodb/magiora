export function applyPublicBrand(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\bKinora\b/g, 'Magiora')
    .replace(/\bkinora\.com\b/gi, 'magiora.com');
}
