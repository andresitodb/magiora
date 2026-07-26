import type { AccentId, TemplateId } from './profile_themes.ts';

export const CINEMATIC_PAGES = ['home', 'about', 'portfolio', 'reel', 'credits', 'gallery', 'equipment', 'contact'] as const;
export const CINEMATIC_HOME_SECTIONS = ['introduction', 'featured_work', 'gallery_preview', 'selected_credits', 'contact_cta'] as const;
export type CinematicPageId = (typeof CINEMATIC_PAGES)[number];
export type CinematicHomeSectionId = (typeof CINEMATIC_HOME_SECTIONS)[number];
export type PageModel = 'one-page' | 'multi-page';

export type TemplateRegistryEntry = {
  id: TemplateId;
  pageModel: PageModel;
  palettes: readonly AccentId[];
  typography: readonly string[];
  navigation: readonly string[];
  homeSections: readonly string[];
  capabilities: readonly string[];
};

export const PROFILE_TEMPLATE_REGISTRY: Record<TemplateId, TemplateRegistryEntry> = {
  editorial: {
    id: 'editorial', pageModel: 'one-page',
    palettes: ['coral', 'monochrome', 'forest', 'ocean'],
    typography: ['editorial', 'modern', 'classic', 'contemporary'],
    navigation: [], homeSections: [],
    capabilities: ['colors', 'typography', 'section-order'],
  },
  cinematic: {
    id: 'cinematic', pageModel: 'multi-page',
    palettes: ['noir', 'silver-screen', 'deep-burgundy', 'midnight-blue'],
    typography: ['auteur', 'premiere', 'modern-cinema', 'festival'],
    navigation: CINEMATIC_PAGES,
    homeSections: CINEMATIC_HOME_SECTIONS,
    capabilities: ['colors', 'typography', 'navigation-order', 'home-section-order'],
  },
  portrait: { id: 'portrait', pageModel: 'one-page', palettes: ['coral'], typography: ['editorial'], navigation: [], homeSections: [], capabilities: ['colors'] },
  minimalist: { id: 'minimalist', pageModel: 'one-page', palettes: ['monochrome'], typography: ['modern'], navigation: [], homeSections: [], capabilities: ['colors'] },
  stage: { id: 'stage', pageModel: 'one-page', palettes: ['midnight'], typography: ['classic'], navigation: [], homeSections: [], capabilities: ['colors'] },
  studio: { id: 'studio', pageModel: 'one-page', palettes: ['ocean'], typography: ['contemporary'], navigation: [], homeSections: [], capabilities: ['colors'] },
};

export function isCinematicPage(value: string): value is CinematicPageId {
  return CINEMATIC_PAGES.includes(value as CinematicPageId);
}

export function getTemplateRegistryEntry(id: TemplateId) {
  return PROFILE_TEMPLATE_REGISTRY[id];
}
