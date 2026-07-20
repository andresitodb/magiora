import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SEARCH_CATEGORIES,
  executeSearch,
  isAbortError,
  isLatestSearchRequest,
  normalizeSearchQuery,
  searchResponseStatus,
  toIlikePattern,
  type SearchCategory,
  type SearchResult,
  type SearchTask,
} from '../src/lib/search.ts';

const result: SearchResult = {
  kind: 'profile',
  id: 'ana',
  title: 'Ana',
  subtitle: null,
  href: '/m/ana',
  thumbnail: null,
};

function tasksWith(
  overrides: Partial<Record<SearchCategory, SearchTask>> = {}
): Record<SearchCategory, SearchTask> {
  return Object.fromEntries(
    SEARCH_CATEGORIES.map((category) => [
      category,
      overrides[category] ??
        (async () => ({ data: [], error: null })),
    ])
  ) as Record<SearchCategory, SearchTask>;
}

test('normalizes whitespace without damaging Unicode or filter-sensitive text', () => {
  assert.deepEqual(normalizeSearchQuery('  María   O\'Connor  '), {
    ok: true,
    query: "María O'Connor",
  });
  assert.deepEqual(normalizeSearchQuery('  Ana,(Director)  '), {
    ok: true,
    query: 'Ana,(Director)',
  });
  assert.deepEqual(normalizeSearchQuery('   \n\t  '), {
    ok: true,
    query: '',
  });
});

test('rejects oversized input before search execution', () => {
  const normalized = normalizeSearchQuery('á'.repeat(101));
  assert.equal(normalized.ok, false);
  if (!normalized.ok) assert.equal(normalized.code, 'INVALID_QUERY');
});

test('escapes SQL wildcard characters without changing the normalized query', () => {
  assert.equal(toIlikePattern('100%_crew\\camera'), '%100\\%\\_crew\\\\camera%');
});

test('returns results and successful empty categories normally', async () => {
  const { response, failures } = await executeSearch(
    tasksWith({ profiles: async () => ({ data: [result], error: null }) })
  );
  assert.deepEqual(response.results, [result]);
  assert.equal(response.partial, false);
  assert.deepEqual(response.failedCategories, []);
  assert.deepEqual(failures, []);
});

test('normalizes null category data to an empty successful result', async () => {
  const { response } = await executeSearch(
    tasksWith({
      profiles: async () => ({
        data: null as unknown as SearchResult[],
        error: null,
      }),
    })
  );
  assert.deepEqual(response.results, []);
  assert.equal(response.partial, false);
});

test('keeps successful results when one category fails', async () => {
  const { response, failures } = await executeSearch(
    tasksWith({
      profiles: async () => ({ data: [result], error: null }),
      events: async () => ({
        data: [],
        error: {
          code: 'CATEGORY_UNAVAILABLE',
          internalCode: 'PGRST001',
          message: 'backend detail',
        },
      }),
    })
  );
  assert.deepEqual(response.results, [result]);
  assert.equal(response.partial, true);
  assert.deepEqual(response.failedCategories, ['events']);
  assert.equal(failures.length, 1);
});

test('reports a complete failure, including thrown unknown errors', async () => {
  const tasks = tasksWith();
  for (const category of SEARCH_CATEGORIES) {
    tasks[category] = async () => {
      throw category === 'profiles' ? 'network down' : new Error('unavailable');
    };
  }
  const { response, failures } = await executeSearch(tasks);
  assert.deepEqual(response.results, []);
  assert.equal(response.partial, false);
  assert.deepEqual(response.failedCategories, SEARCH_CATEGORIES);
  assert.equal(failures.length, SEARCH_CATEGORIES.length);
  assert.equal(searchResponseStatus(failures.length), 503);
});

test('partial and successful searches retain HTTP 200 semantics', () => {
  assert.equal(searchResponseStatus(0), 200);
  assert.equal(searchResponseStatus(1), 200);
});

test('recognizes aborted and stale client requests', () => {
  assert.equal(isAbortError(new DOMException('Aborted', 'AbortError')), true);
  assert.equal(isAbortError(new Error('Network error')), false);
  assert.equal(isLatestSearchRequest(4, 4), true);
  assert.equal(isLatestSearchRequest(3, 4), false);
});
