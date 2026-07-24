// Profile theme system — templates × color palettes.

export type TemplateId =
  | 'editorial'
  | 'cinematic'
  | 'portrait'
  | 'minimalist'
  | 'stage'
  | 'studio';
export type AccentId = 'coral' | 'monochrome' | 'forest' | 'ocean' | 'sunset' | 'midnight';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
}

export interface Accent {
  id: AccentId;
  name: string;
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  buttonBackground: string;
  buttonText: string;
  overlayText: string;
  overlayBackground: string;
  /** Backwards-compatible aliases consumed by the existing public profile. */
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
    name: 'Editorial Portfolio',
    description: 'A considered masthead, asymmetric portrait, selected work and long-form biography.',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Showcase',
    description: 'A full-bleed image-led opening with bold titles and a sequence of featured projects.',
  },
  {
    id: 'portrait',
    name: 'Full-bleed Portrait',
    description: 'An immersive portrait-led introduction with credentials and work arranged alongside.',
  },
  {
    id: 'minimalist',
    name: 'Quiet Index',
    description: 'A precise studio index with restrained type, generous space and structured case studies.',
  },
  {
    id: 'stage',
    name: 'Stage Presence',
    description: 'A theatrical presentation for performance credits, appearances and live creative practice.',
  },
  {
    id: 'studio',
    name: 'Studio Portfolio',
    description: 'A modular case-study site for directors, designers, photographers, crew and multidisciplinary work.',
  },
];

export const ACCENTS: Accent[] = [
  {
    id: 'coral',
    name: 'Coral',
    background: '#f5f3ee', surface: '#ffffff', primaryText: '#1c1917', secondaryText: '#57534e',
    buttonBackground: '#712B13', buttonText: '#ffffff', overlayText: '#ffffff', overlayBackground: '#1c1917',
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
    background: '#fafaf9', surface: '#ffffff', primaryText: '#1c1917', secondaryText: '#57534e',
    buttonBackground: '#1c1917', buttonText: '#ffffff', overlayText: '#ffffff', overlayBackground: '#1c1917',
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
    background: '#f4f6f3', surface: '#ffffff', primaryText: '#1a2410', secondaryText: '#46523f',
    buttonBackground: '#2d5016', buttonText: '#ffffff', overlayText: '#ffffff', overlayBackground: '#1a3009',
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
    background: '#f2f5f8', surface: '#ffffff', primaryText: '#101e30', secondaryText: '#475569',
    buttonBackground: '#1e3a5f', buttonText: '#ffffff', overlayText: '#ffffff', overlayBackground: '#0f2238',
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
    background: '#fef5ee', surface: '#ffffff', primaryText: '#1c1207', secondaryText: '#6b4f45',
    buttonBackground: '#9a3412', buttonText: '#ffffff', overlayText: '#ffffff', overlayBackground: '#431407',
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
    background: '#1a1816', surface: '#252220', primaryText: '#f5f3ee', secondaryText: '#d6d3d1',
    buttonBackground: '#facc15', buttonText: '#1c1917', overlayText: '#ffffff', overlayBackground: '#0c0a09',
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

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const rgb = hex.slice(1).match(/.{2}/g)?.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }) ?? [0, 0, 0];
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
