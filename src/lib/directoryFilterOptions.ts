import { getLanguageName, LANGUAGES } from './languages.ts';

export type DirectoryFilterOption = {
  value: string;
  label: string;
  count: number;
  searchTerms: string[];
};

export type DirectoryFilterProfile = {
  id?: string;
  role_category?: unknown;
  role_categories?: unknown;
  role_titles?: unknown;
  custom_role_label?: unknown;
  languages?: unknown;
};

const ROLE_ALIASES: Record<string, string[]> = {
  'director of photography': ['dp', 'dop'],
  cinematographer: ['dp', 'dop', 'director of photography'],
  'first assistant director': ['1st ad', 'first ad', 'ad'],
  'assistant director': ['ad', '1st ad'],
};

const LANGUAGE_ALIASES: Record<string, string[]> = {
  Spanish: ['espanol', 'español', 'castellano', 'esp'],
  English: ['ingles', 'inglés', 'eng'],
  French: ['frances', 'francés'],
  Italian: ['italiano'],
  Portuguese: ['portugues', 'portugués'],
  German: ['aleman', 'alemán'],
  Russian: ['ruso', 'rusa'],
};

export function directoryStringValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(directoryStringValues);
  }
  if (typeof value !== 'string') return [];
  const clean = value.trim();
  if (!clean) return [];
  if (
    (clean.startsWith('[') && clean.endsWith(']')) ||
    (clean.startsWith('"') && clean.endsWith('"'))
  ) {
    try {
      return directoryStringValues(JSON.parse(clean));
    } catch {
      return [];
    }
  }
  if (clean.startsWith('{') && clean.endsWith('}')) {
    return clean
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }
  return [clean];
}

export function normalizeDirectorySearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function displayRole(value: string) {
  const clean = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (/^(1st|2nd|3rd)\s+ad$/i.test(clean)) return clean.toUpperCase();
  return clean
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
    .replace(/\b(Of|And|The|For)\b/g, (word) => word.toLocaleLowerCase());
}

function addCount(map: Map<string, { label: string; count: number }>, label: string) {
  const key = normalizeDirectorySearch(label);
  if (!key) return;
  const current = map.get(key);
  map.set(key, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
}

function uniqueDisplayValues(values: unknown[]) {
  const unique = new Map<string, string>();
  for (const value of values.flatMap(directoryStringValues)) {
    const label = displayRole(value);
    const key = normalizeDirectorySearch(label);
    if (key && !unique.has(key)) unique.set(key, label);
  }
  return [...unique.values()];
}

export function buildDirectoryFilterOptions(rows: DirectoryFilterProfile[]) {
  const roles = new Map<string, { label: string; count: number }>();
  const languages = new Map<string, { label: string; count: number; value: string }>();

  for (const row of rows) {
    const profileRoles = uniqueDisplayValues([
      row.role_titles,
      row.role_categories,
      row.role_category,
      row.custom_role_label,
    ]);
    for (const role of profileRoles) addCount(roles, displayRole(role));

    const profileLanguages = new Map<string, { value: string; label: string }>();
    for (const stored of directoryStringValues(row.languages)) {
      const catalog = LANGUAGES.find((language) =>
        language.code.toLocaleLowerCase() === stored.toLocaleLowerCase() ||
        normalizeDirectorySearch(language.name) === normalizeDirectorySearch(stored),
      );
      const language = catalog
        ? { value: catalog.code, label: catalog.name }
        : { value: stored.trim(), label: getLanguageName(stored.trim()) };
      const key = normalizeDirectorySearch(language.label);
      if (key && !profileLanguages.has(key)) profileLanguages.set(key, language);
    }
    for (const [key, language] of profileLanguages) {
      const current = languages.get(key);
      languages.set(key, { ...language, count: (current?.count ?? 0) + 1 });
    }
  }

  return {
    roles: [...roles.values()].map(({ label, count }) => ({
      value: label,
      label,
      count,
      searchTerms: [label, ...(ROLE_ALIASES[normalizeDirectorySearch(label)] ?? [])],
    })).sort((a, b) => a.label.localeCompare(b.label)),
    languages: [...languages.values()].map(({ value, label, count }) => ({
      value,
      label,
      count,
      searchTerms: [label, ...(LANGUAGE_ALIASES[label] ?? [])],
    })).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function filterDirectoryOptions(options: DirectoryFilterOption[], query: string) {
  const needle = normalizeDirectorySearch(query);
  if (!needle) return options;
  return options.filter((option) =>
    option.searchTerms.some((term) => {
      const normalized = normalizeDirectorySearch(term);
      return normalized === needle || normalized.startsWith(needle) || normalized.split(' ').some((word) => word.startsWith(needle));
    }),
  );
}

export function profileMatchesDirectoryRole(row: DirectoryFilterProfile, selected: string) {
  const target = normalizeDirectorySearch(selected);
  return uniqueDisplayValues([
    row.role_titles,
    row.role_categories,
    row.role_category,
    row.custom_role_label,
  ]).some((role) => normalizeDirectorySearch(role) === target);
}

export function profileMatchesDirectoryLanguage(row: DirectoryFilterProfile, selected: string) {
  const selectedLanguage = LANGUAGES.find((language) => language.code === selected);
  const targets = new Set([
    normalizeDirectorySearch(selected),
    normalizeDirectorySearch(selectedLanguage?.name ?? ''),
  ]);
  return directoryStringValues(row.languages).some((language) =>
    targets.has(normalizeDirectorySearch(language)),
  );
}
