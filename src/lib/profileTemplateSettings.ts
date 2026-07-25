import {
  DEFAULT_ACCENT,
  DEFAULT_TEMPLATE,
  getAccent,
  getSupportedAccents,
  getTemplate,
  isTemplateAccentSupported,
  type AccentId,
  type TemplateId,
} from './profile_themes.ts';
import {
  CINEMATIC_HOME_SECTIONS,
  CINEMATIC_PAGES,
  type CinematicHomeSectionId,
  type CinematicPageId,
} from './profileTemplateRegistry.ts';

export const SCREEN_PRESENCE_SECTIONS = [
  'about',
  'gallery',
  'reel',
  'work',
  'credits',
  'practice',
  'recommendations',
  'contact',
] as const;

export type ScreenPresenceSectionId = (typeof SCREEN_PRESENCE_SECTIONS)[number];
export type TypographyStyle =
  | 'editorial' | 'modern' | 'classic' | 'contemporary'
  | 'auteur' | 'premiere' | 'modern-cinema' | 'festival';

export const TYPOGRAPHY_SYSTEMS: ReadonlyArray<{
  id: TypographyStyle;
  name: string;
  displayClass: string;
  bodyClass: string;
  metadataClass: string;
  headingClass: string;
}> = [
  { id: 'editorial', name: 'Editorial', displayClass: 'font-serif', bodyClass: 'font-serif', metadataClass: 'tracking-[0.18em]', headingClass: 'tracking-[-0.025em]' },
  { id: 'modern', name: 'Modern', displayClass: 'font-sans', bodyClass: 'font-sans', metadataClass: 'tracking-[0.12em]', headingClass: 'tracking-[-0.04em]' },
  { id: 'classic', name: 'Classic', displayClass: 'font-serif', bodyClass: 'font-serif', metadataClass: 'tracking-[0.2em]', headingClass: 'tracking-normal' },
  { id: 'contemporary', name: 'Contemporary', displayClass: 'font-sans', bodyClass: 'font-serif', metadataClass: 'tracking-[0.16em]', headingClass: 'tracking-[-0.015em]' },
  { id: 'auteur', name: 'Auteur', displayClass: 'font-serif', bodyClass: 'font-sans', metadataClass: 'tracking-[0.24em]', headingClass: 'tracking-[-0.04em]' },
  { id: 'premiere', name: 'Premiere', displayClass: 'font-serif', bodyClass: 'font-serif', metadataClass: 'tracking-[0.18em]', headingClass: 'tracking-[-0.02em]' },
  { id: 'modern-cinema', name: 'Modern Cinema', displayClass: 'font-sans', bodyClass: 'font-sans', metadataClass: 'tracking-[0.14em]', headingClass: 'tracking-[-0.055em]' },
  { id: 'festival', name: 'Festival', displayClass: 'font-sans', bodyClass: 'font-serif', metadataClass: 'tracking-[0.28em]', headingClass: 'tracking-[-0.01em]' },
];

export type ProfileTemplateSettings = {
  templateId: TemplateId;
  paletteId: AccentId;
  fontStyle: TypographyStyle;
  sectionOrder: ScreenPresenceSectionId[];
  hiddenSections: ScreenPresenceSectionId[];
  navigationOrder: CinematicPageId[];
  homeSectionOrder: CinematicHomeSectionId[];
};

export type StoredProfileTemplateSettings = {
  template_id?: string | null;
  palette_id?: string | null;
  font_style?: string | null;
  section_order?: unknown;
  hidden_sections?: unknown;
  navigation_order?: unknown;
  home_section_order?: unknown;
} | null;

export function isTypographyStyle(value: unknown): value is TypographyStyle {
  return TYPOGRAPHY_SYSTEMS.some((system) => system.id === value);
}

export function normalizeSectionOrder(value: unknown): ScreenPresenceSectionId[] {
  const submitted = Array.isArray(value) ? value : [];
  const known = submitted.filter(
    (item, index): item is ScreenPresenceSectionId =>
      typeof item === 'string' &&
      SCREEN_PRESENCE_SECTIONS.includes(item as ScreenPresenceSectionId) &&
      submitted.indexOf(item) === index,
  );
  return [
    ...known,
    ...SCREEN_PRESENCE_SECTIONS.filter((section) => !known.includes(section)),
  ];
}

export function normalizeHiddenSections(value: unknown): ScreenPresenceSectionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item, index): item is ScreenPresenceSectionId =>
      typeof item === 'string' &&
      SCREEN_PRESENCE_SECTIONS.includes(item as ScreenPresenceSectionId) &&
      value.indexOf(item) === index,
  );
}

function normalizeOrder<T extends string>(value: unknown, canonical: readonly T[]): T[] {
  const submitted = Array.isArray(value) ? value : [];
  const known = submitted.filter(
    (item, index): item is T =>
      typeof item === 'string' && canonical.includes(item as T) && submitted.indexOf(item) === index,
  );
  return [...known, ...canonical.filter((item) => !known.includes(item))];
}

export const normalizeCinematicNavigationOrder = (value: unknown) =>
  normalizeOrder(value, CINEMATIC_PAGES);
export const normalizeCinematicHomeSectionOrder = (value: unknown) =>
  normalizeOrder(value, CINEMATIC_HOME_SECTIONS);

export function moveSection(
  order: ScreenPresenceSectionId[],
  section: ScreenPresenceSectionId,
  direction: -1 | 1,
) {
  const normalized = normalizeSectionOrder(order);
  const index = normalized.indexOf(section);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= normalized.length) return normalized;
  const next = [...normalized];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function resolveProfileTemplateSettings({
  local,
  saved,
  legacyTemplate,
  legacyAccent,
}: {
  local?: Partial<ProfileTemplateSettings> | null;
  saved?: StoredProfileTemplateSettings;
  legacyTemplate?: string | null;
  legacyAccent?: string | null;
}): ProfileTemplateSettings {
  const templateId = getTemplate(local?.templateId ?? saved?.template_id ?? legacyTemplate ?? DEFAULT_TEMPLATE).id;
  const requestedPalette = getAccent(local?.paletteId ?? saved?.palette_id ?? legacyAccent ?? DEFAULT_ACCENT).id;
  const paletteId = isTemplateAccentSupported(templateId, requestedPalette)
    ? requestedPalette
    : getSupportedAccents(templateId)[0].id;
  return {
    templateId,
    paletteId,
    fontStyle: isTypographyStyle(local?.fontStyle)
      ? local.fontStyle
      : isTypographyStyle(saved?.font_style)
        ? saved.font_style
        : 'editorial',
    sectionOrder: normalizeSectionOrder(local?.sectionOrder ?? saved?.section_order),
    hiddenSections: normalizeHiddenSections(local?.hiddenSections ?? saved?.hidden_sections),
    navigationOrder: normalizeCinematicNavigationOrder(local?.navigationOrder ?? saved?.navigation_order),
    homeSectionOrder: normalizeCinematicHomeSectionOrder(local?.homeSectionOrder ?? saved?.home_section_order),
  };
}
