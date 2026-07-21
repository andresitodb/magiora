import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canBrowseCasting,
  DIRECTORY_PAGE_SIZE,
  projectCountLabel,
  seededSubset,
  selectUpcomingEvents,
  shouldRandomizeDirectory,
  stringSeed,
} from '../src/lib/designPolish.ts';

test('project counts are hidden at zero and shown when positive', () => {
  assert.equal(projectCountLabel(0, true), null);
  assert.equal(projectCountLabel(3, true), '3 projects');
  assert.equal(projectCountLabel(1, true), '1 project');
});

test('anonymous casting is gated while authenticated casting remains available', () => {
  assert.equal(canBrowseCasting(null), false);
  assert.equal(canBrowseCasting(undefined), false);
  assert.equal(canBrowseCasting('profile-1'), true);
});

test('Upcoming Events excludes past events, orders dates, and returns at most three', () => {
  const selected = selectUpcomingEvents(
    [
      { id: 'past', event_date: '2026-07-19T12:00:00.000Z' },
      { id: 'fourth', event_date: '2026-07-24T12:00:00.000Z' },
      { id: 'third', event_date: '2026-07-23T12:00:00.000Z' },
      { id: 'first', event_date: '2026-07-21T12:00:00.000Z' },
      { id: 'second', event_date: '2026-07-22T12:00:00.000Z' },
    ],
    '2026-07-20T12:00:00.000Z'
  );
  assert.deepEqual(selected.map((event) => event.id), ['first', 'second', 'third']);
});

test('Directory defaults to 20 and only randomizes the initial implicit view', () => {
  assert.equal(DIRECTORY_PAGE_SIZE, 20);
  assert.equal(
    shouldRandomizeDirectory({ hasFilters: false, hasExplicitSort: false, page: 1 }),
    true
  );
  assert.equal(
    shouldRandomizeDirectory({ hasFilters: false, hasExplicitSort: true, page: 1 }),
    false
  );
  assert.equal(
    shouldRandomizeDirectory({ hasFilters: true, hasExplicitSort: false, page: 1 }),
    false
  );
  assert.deepEqual(seededSubset([1, 2, 3, 4], 3, 42), seededSubset([1, 2, 3, 4], 3, 42));
  assert.equal(stringSeed('request-a'), stringSeed('request-a'));
});
