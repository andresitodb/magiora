import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { computeDashboardCompleteness } from './src/lib/dashboardFoundation.ts';
import {
  PROFILE_CHAPTERS,
  getChapterProgress,
  getProfilePublicStatus,
  getRequestedMemberFeatures,
  shouldTrackProfileChange,
  shouldWarnForUnsavedChanges,
  validationSummary,
} from './src/lib/profileExperience.ts';

test('profile fields are grouped into the six editorial chapters', () => {
  assert.deepEqual(PROFILE_CHAPTERS.map((chapter) => chapter.label), [
    'Profile essentials',
    'Professional practice',
    'Work',
    'Contact',
    'Public presence',
    'Trust & account',
  ]);

  const progress = getChapterProgress(computeDashboardCompleteness({
    display_name: 'Ava Stone',
    role_titles: ['Actor'],
  }));
  assert.deepEqual(progress.map(({ id, total }) => [id, total]), [
    ['profile-essentials', 5],
    ['professional-practice', 2],
    ['work', 2],
    ['contact-chapter', 1],
    ['public-presence', 0],
    ['trust-account', 0],
  ]);
  assert.equal(progress[0].completed, 2);
  assert.equal(progress[0].percent, 40);
});

test('public profile status uses approved and visible without introducing another state', () => {
  assert.equal(getProfilePublicStatus(true, true), 'Public');
  assert.equal(getProfilePublicStatus(false, true), 'Private');
  assert.equal(getProfilePublicStatus(true, false), 'Awaiting approval');
  assert.equal(getProfilePublicStatus(false, false), 'Awaiting approval');
});

test('dirty state tracks only main-form changes and excludes auto-saved media', () => {
  assert.equal(shouldTrackProfileChange({ formId: 'profile-form', autoSaved: false }), true);
  assert.equal(shouldTrackProfileChange({ formId: 'profile-form', autoSaved: true }), false);
  assert.equal(shouldTrackProfileChange({ formId: 'password-form', autoSaved: false }), false);
});

test('sticky save warning ignores chapter navigation and successful submission', () => {
  assert.equal(shouldWarnForUnsavedChanges({ dirty: true, submitting: false, destination: '/dashboard' }), true);
  assert.equal(shouldWarnForUnsavedChanges({ dirty: true, submitting: false, destination: '#work' }), false);
  assert.equal(shouldWarnForUnsavedChanges({ dirty: true, submitting: true, destination: '/dashboard' }), false);
  assert.equal(shouldWarnForUnsavedChanges({ dirty: false, submitting: false, destination: '/dashboard' }), false);
});

test('profile editor renders a sticky save region and marks media as auto-saved', () => {
  const experienceSource = readFileSync(
    new URL('./src/components/ProfileEditorExperience.tsx', import.meta.url),
    'utf8',
  );
  const profileSource = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(experienceSource, /data-sticky-save/);
  assert.match(experienceSource, /fixed inset-x-4 bottom-3/);
  assert.match(profileSource, /data-auto-saved="true"/);
});

test('validation summary maps errors to the most relevant profile section', () => {
  assert.deepEqual(validationSummary('Demo reel must be a valid URL'), {
    title: 'Your profile was not saved',
    message: 'Demo reel must be a valid URL',
    target: 'portfolio',
  });
  assert.equal(validationSummary('That link is already taken')?.target, 'public-presence');
  assert.equal(validationSummary(null), null);
});

test('Member save gate identifies previews without changing Member submissions', () => {
  assert.deepEqual(getRequestedMemberFeatures({
    isMember: false,
    currentSlug: 'ava-stone',
    requestedSlug: 'ava-directs',
    requestedTheme: 'cinematic',
    requestedAccent: 'forest',
    skillCount: 7,
  }), [
    'Custom profile URL',
    'Profile theme',
    'Color palette',
    'Additional skills',
  ]);
  assert.deepEqual(getRequestedMemberFeatures({
    isMember: true,
    currentSlug: 'ava-stone',
    requestedSlug: 'ava-directs',
    requestedTheme: 'cinematic',
    requestedAccent: 'forest',
    skillCount: 7,
  }), []);
});

test('Member presentation remains interactive and pricing copy matches actual limits', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  const slugSource = readFileSync(
    new URL('./src/components/SlugEditor.tsx', import.meta.url),
    'utf8',
  );
  const pricingSource = readFileSync(
    new URL('./src/app/pricing/page.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(themeSource, /disabled=\{!isMember\}/);
  assert.doesNotMatch(slugSource, /disabled=\{!isMember\}/);
  assert.match(pricingSource, /up to 10 gallery photos/i);
  assert.match(pricingSource, /4 profile themes &amp; 6 color palettes/i);
  assert.match(pricingSource, /Up to 4 additional video links/i);
});
