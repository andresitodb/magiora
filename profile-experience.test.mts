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
import { ACCENTS, TEMPLATES, contrastRatio } from './src/lib/profile_themes.ts';

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

test('profile presentation uses page-like previews and keeps Member styling intentional', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  const memberSource = readFileSync(
    new URL('./src/components/MemberEdition.tsx', import.meta.url),
    'utf8',
  );
  assert.match(themeSource, /aria-label="Live profile preview"/);
  assert.match(themeSource, /data-template-preview=\{templateId\}/);
  assert.match(themeSource, /magiora:profile-preview/);
  assert.doesNotMatch(memberSource, /yellow|opacity-50|pointer-events-none|\block\b/i);
  assert.match(memberSource, /Member edition/);
});

test('navigation keeps discovery public and uses the dashboard model only inside dashboard routes', () => {
  const navSource = readFileSync(
    new URL('./src/components/Nav.tsx', import.meta.url),
    'utf8',
  );
  for (const label of ['Home', 'Dashboard', 'Profile', 'Projects', 'Casting', 'Applications']) {
    assert.match(navSource, new RegExp(`label: '${label}'`));
  }
  assert.match(navSource, /variant === 'dashboard'/);
  assert.match(navSource, /showDashboardShortcut=\{variant === 'public'\}/);
  assert.match(navSource, /href="\/dashboard\/applications"/);
  assert.match(navSource, /My Applications/);
  assert.doesNotMatch(navSource, /label: 'Workspace'/);
});

test('dashboard public profile action is visible, secondary, and not icon-only', () => {
  const cardSource = readFileSync(
    new URL('./src/components/DashboardCard.tsx', import.meta.url),
    'utf8',
  );
  const dashboardSource = readFileSync(
    new URL('./src/app/dashboard/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(dashboardSource, /label: 'View Public Profile'/);
  assert.match(cardSource, /\{secondaryAction\.label\}/);
  assert.match(cardSource, /ml-auto text-right/);
  assert.doesNotMatch(cardSource, /secondaryAction\.icon/);
});

test('every palette provides readable semantic text, buttons, and overlays for every template', () => {
  assert.equal(TEMPLATES.length, 4);
  for (const palette of ACCENTS) {
    assert.ok(contrastRatio(palette.primaryText, palette.background) >= 4.5, `${palette.name} primary text`);
    assert.ok(contrastRatio(palette.secondaryText, palette.background) >= 4.5, `${palette.name} secondary text`);
    assert.ok(contrastRatio(palette.buttonText, palette.buttonBackground) >= 4.5, `${palette.name} button`);
    assert.ok(contrastRatio(palette.overlayText, palette.overlayBackground) >= 4.5, `${palette.name} overlay`);
    for (const template of TEMPLATES) {
      assert.ok(template.id && palette.surface && palette.border, `${palette.name}/${template.name} tokens`);
    }
  }
});

test('full profile preview is local, keyboard dismissible, and focus trapped', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  assert.match(themeSource, /Open full preview/);
  assert.match(themeSource, /aria-modal="true"/);
  assert.match(themeSource, /event\.key === 'Escape'/);
  assert.match(themeSource, /event\.key !== 'Tab'/);
  assert.match(themeSource, /fullPreviewOpen/);
});

test('chapter rhythm removes terminal form padding and verification stays separate from membership', () => {
  const formSource = readFileSync(
    new URL('./src/components/ProfileEditorExperience.tsx', import.meta.url),
    'utf8',
  );
  const profileSource = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(formSource, /className="space-y-10"/);
  assert.doesNotMatch(formSource, /space-y-10 pb-20/);
  assert.match(profileSource, /Verification confirms identity and professional authenticity/);
  assert.match(profileSource, /separately from Magiora membership/);
});
