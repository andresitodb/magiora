// Profile theme system — templates × color palettes.

export type TemplateId = 'editorial' | 'cinematic' | 'portrait' | 'minimalist';
export type AccentId = 'coral' | 'monochrome' | 'forest' | 'ocean' | 'sunset' | 'midnight';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
}

export interface Accent {
  id: AccentId;
  name: string;
  bg: string;
  card: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  border: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style. Photo left, bio right. Serif heavy. The default.',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Big hero photo. Name overlay. Modern, dramatic.',
  },
  {
    id: 'portrait',
    name: 'Portrait',
    description: 'Gallery-card style. Photo framed, name and role below. Formal.',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Centered, sparse. Lots of whitespace. Resume-style.',
  },
];

export const ACCENTS: Accent[] = [
  {
    id: 'coral',
    name: 'Coral',
    bg: '#f5f3ee',
    card: '#ffffff',
    accent: '#712B13',
    accentDark: '#4A1B0C',
    accentSoft: '#FAECE7',
    text: '#1c1917',
    textMuted: '#78716c',
    border: '#e7e5e4',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    bg: '#fafaf9',
    card: '#ffffff',
    accent: '#1c1917',
    accentDark: '#000000',
    accentSoft: '#f5f5f4',
    text: '#1c1917',
    textMuted: '#78716c',
    border: '#e7e5e4',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#f4f6f3',
    card: '#ffffff',
    accent: '#2d5016',
    accentDark: '#1a3009',
    accentSoft: '#dde7d2',
    text: '#1a2410',
    textMuted: '#516456',
    border: '#dbe3d6',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: '#f2f5f8',
    card: '#ffffff',
    accent: '#1e3a5f',
    accentDark: '#0f2238',
    accentSoft: '#dbe5f0',
    text: '#101e30',
    textMuted: '#536479',
    border: '#d7dfe9',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: '#fef5ee',
    card: '#ffffff',
    accent: '#c2410c',
    accentDark: '#7c2d12',
    accentSoft: '#fed7aa',
    text: '#1c1207',
    textMuted: '#78584c',
    border: '#f5e0cc',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#1a1816',
    card: '#252220',
    accent: '#facc15',
    accentDark: '#eab308',
    accentSoft: '#3a3530',
    text: '#f5f3ee',
    textMuted: '#a8a29e',
    border: '#3a3530',
  },
];

export const DEFAULT_TEMPLATE: TemplateId = 'editorial';
export const DEFAULT_ACCENT: AccentId = 'coral';

export function getTemplate(id: string | null | undefined): Template {
  // back-compat: 'polaroid' from previous batch maps to 'portrait'
  if (id === 'polaroid') return TEMPLATES.find((t) => t.id === 'portrait') ?? TEMPLATES[0];
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function getAccent(id: string | null | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}
