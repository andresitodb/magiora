// Library for The Craft — educational articles section

export type CraftCategory =
  | 'cinema'
  | 'television'
  | 'theater'
  | 'production'
  | 'sound'
  | 'camera'
  | 'directing'
  | 'acting'
  | 'editing'
  | 'business';

export interface CraftArticle {
  id: string;
  slug: string;
  title_en: string;
  title_es: string;
  intro_en: string | null;
  intro_es: string | null;
  body_en: string;
  body_es: string;
  category: CraftCategory;
  reading_minutes: number;
  cover_image_url: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publish_at: string;
  author_id: string | null;
}

export const CRAFT_CATEGORIES: Array<{ id: CraftCategory; label_en: string; label_es: string }> = [
  { id: 'camera', label_en: 'Camera', label_es: 'Cámara' },
  { id: 'sound', label_en: 'Sound', label_es: 'Sonido' },
  { id: 'directing', label_en: 'Directing', label_es: 'Dirección' },
  { id: 'acting', label_en: 'Acting', label_es: 'Actuación' },
  { id: 'editing', label_en: 'Editing', label_es: 'Edición' },
  { id: 'production', label_en: 'Production', label_es: 'Producción' },
  { id: 'theater', label_en: 'Theater', label_es: 'Teatro' },
  { id: 'television', label_en: 'Television', label_es: 'Televisión' },
  { id: 'business', label_en: 'Business', label_es: 'Industria' },
  { id: 'cinema', label_en: 'Cinema', label_es: 'Cine' },
];

export function getCategoryLabel(category: CraftCategory, locale: string): string {
  const cat = CRAFT_CATEGORIES.find((c) => c.id === category);
  if (!cat) return category;
  return locale === 'es' ? cat.label_es : cat.label_en;
}

export function getArticleTitle(article: CraftArticle, locale: string): string {
  return locale === 'es' ? article.title_es : article.title_en;
}

export function getArticleIntro(article: CraftArticle, locale: string): string | null {
  return locale === 'es' ? article.intro_es : article.intro_en;
}

export function getArticleBody(article: CraftArticle, locale: string): string {
  return locale === 'es' ? article.body_es : article.body_en;
}
