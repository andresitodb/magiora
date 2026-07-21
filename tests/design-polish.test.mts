import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canBrowseCasting,
  DIRECTORY_PAGE_SIZE,
  projectCountLabel,
  seededSubset,
  selectUpcomingEvents,
  selectFeaturedProjects,
  featuredProjectsHeading,
  shouldRandomizeDirectory,
  stringSeed,
} from '../src/lib/designPolish.ts';
import { shouldShowEventImage } from '../src/lib/eventArtwork.ts';

test('project counts are hidden at zero and shown when positive', () => {
  assert.equal(projectCountLabel(0, true), null);
  assert.equal(projectCountLabel(3, true), '3 projects');
  assert.equal(projectCountLabel(1, true), '1 project');
});

test('Featured Projects hides at zero, uses singular at one, and shows two with a plural heading', () => {
  assert.deepEqual(selectFeaturedProjects([]), []);
  assert.equal(featuredProjectsHeading(0), null);

  const one = selectFeaturedProjects([{ id: 'one' }]);
  assert.deepEqual(one.map((project) => project.id), ['one']);
  assert.equal(featuredProjectsHeading(one.length), 'Featured Project');

  const two = selectFeaturedProjects([{ id: 'one' }, { id: 'two' }, { id: 'three' }]);
  assert.deepEqual(two.map((project) => project.id), ['one', 'two']);
  assert.equal(featuredProjectsHeading(two.length), 'Featured Projects');
});

test('event artwork falls back for missing or failed images', () => {
  assert.equal(shouldShowEventImage(null, false), false);
  assert.equal(shouldShowEventImage('', false), false);
  assert.equal(shouldShowEventImage('https://example.com/event.jpg', false), true);
  assert.equal(shouldShowEventImage('https://example.com/event.jpg', true), false);
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
