export const SEARCH_CATEGORIES = [
  'profiles',
  'projects',
  'castings',
  'events',
  'spotlight',
] as const;

export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

export interface SearchResult {
  kind: 'profile' | 'project' | 'casting_call' | 'event' | 'story';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  thumbnail: string | null;
}

export interface SearchCategoryError {
  code: string;
  internalCode: string | null;
  message: string | null;
}

export interface SearchCategoryResult<T> {
  data: T[];
  error: SearchCategoryError | null;
}

export interface SearchSuccessResponse {
  results: SearchResult[];
  partial: boolean;
  failedCategories: SearchCategory[];
}

export interface SearchErrorResponse extends SearchSuccessResponse {
  error: {
    code: 'SEARCH_UNAVAILABLE' | 'INVALID_QUERY';
    message: string;
  };
}

export type SearchTask = () => Promise<SearchCategoryResult<SearchResult>>;

export const MAX_SEARCH_LENGTH = 100;
export const MIN_SEARCH_LENGTH = 2;

export function normalizeSearchQuery(value: string):
  | { ok: true; query: string }
  | { ok: false; code: 'INVALID_QUERY'; message: string } {
  const query = value.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (Array.from(query).length > MAX_SEARCH_LENGTH) {
    return {
      ok: false,
      code: 'INVALID_QUERY',
      message: `Search terms must be ${MAX_SEARCH_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, query };
}

export function toIlikePattern(query: string): string {
  const escaped = query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  return `%${escaped}%`;
}

export function categoryFailure(error: unknown): SearchCategoryError {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: 'CATEGORY_UNAVAILABLE',
      internalCode:
        typeof candidate.code === 'string' && candidate.code
          ? candidate.code
          : null,
      message:
        typeof candidate.message === 'string' && candidate.message
          ? candidate.message
          : null,
    };
  }
  return {
    code: 'CATEGORY_UNAVAILABLE',
    internalCode: null,
    message: null,
  };
}

export async function executeSearch(
  tasks: Record<SearchCategory, SearchTask>
): Promise<{
  response: SearchSuccessResponse;
  failures: Array<{ category: SearchCategory; error: SearchCategoryError }>;
}> {
  const settled = await Promise.allSettled(
    SEARCH_CATEGORIES.map((category) => tasks[category]())
  );
  const results: SearchResult[] = [];
  const failures: Array<{
    category: SearchCategory;
    error: SearchCategoryError;
  }> = [];

  settled.forEach((outcome, index) => {
    const category = SEARCH_CATEGORIES[index];
    if (outcome.status === 'rejected') {
      failures.push({ category, error: categoryFailure(outcome.reason) });
      return;
    }
    if (outcome.value.error) {
      failures.push({ category, error: outcome.value.error });
      return;
    }
    results.push(...(outcome.value.data ?? []));
  });

  return {
    response: {
      results,
      partial: failures.length > 0 && failures.length < SEARCH_CATEGORIES.length,
      failedCategories: failures.map(({ category }) => category),
    },
    failures,
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isLatestSearchRequest(
  requestId: number,
  latestRequestId: number
): boolean {
  return requestId === latestRequestId;
}

export function searchResponseStatus(failureCount: number): 200 | 503 {
  return failureCount === SEARCH_CATEGORIES.length ? 503 : 200;
}
