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
import {
  ACCENTS,
  LEGACY_TEMPLATE_ID_MAP,
  TEMPLATES,
  contrastRatio,
  getSupportedAccents,
  getTemplate,
  isTemplateAccentSupported,
} from './src/lib/profile_themes.ts';
import { aggregatePreviewProjects, mergeProfilePreviewData, type ProfilePreviewData } from './src/lib/profilePreview.ts';
import {
  canAddProfileGalleryFiles,
  FREE_PROFILE_GALLERY_LIMIT,
  getProfileGalleryPresentation,
  MEMBER_PROFILE_GALLERY_LIMIT,
} from './src/lib/profileGallery.ts';
import {
  getExperienceReferencePresentation,
  getLegacyExperienceReference,
  INVALID_IMDB_MESSAGE,
  INVALID_OFFICIAL_WEBSITE_MESSAGE,
  normalizeExperienceForEditor,
  preserveSubmittedExperience,
  validateExperienceReference,
} from './src/lib/experienceReferences.ts';
import {
  getActiveProfileSkills,
  getActiveProfileVideos,
  retainMemberSelection,
  retainProfileSkills,
  retainProfileVideos,
} from './src/lib/profileMemberRetention.ts';
import {
  getBrandDisplayDomain,
  getProfileDomainPreview,
} from './src/lib/brandDomain.ts';
import { getScreenPresenceSections } from './src/lib/screenPresence.ts';
import {
  isTypographyStyle,
  moveSection,
  normalizeSectionOrder,
  resolveProfileTemplateSettings,
  SCREEN_PRESENCE_SECTIONS,
  TYPOGRAPHY_SYSTEMS,
} from './src/lib/profileTemplateSettings.ts';
import { resolveMemberEntitlement } from './src/lib/memberEntitlement.ts';

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
    currentSkillCount: 5,
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
    currentSkillCount: 5,
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
  assert.match(pricingSource, /6 profile themes &amp; 6 color palettes/i);
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
  assert.doesNotMatch(themeSource, /LiveProfilePreview/);
  assert.match(themeSource, /TemplateMiniature/);
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
  assert.match(navSource, /\{ href: '\/dashboard\/applications', label: 'Applications' \}/);
  assert.doesNotMatch(navSource, /My Applications/);
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
  assert.match(cardSource, /ml-auto[^"]*text-right/);
  assert.doesNotMatch(cardSource, /secondaryAction\.icon/);
});

test('every palette provides readable semantic text, buttons, and overlays for every template', () => {
  assert.equal(TEMPLATES.length, 6);
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

test('all six templates are registered with distinct portfolio directions', () => {
  assert.deepEqual(TEMPLATES.map(({ id }) => id), [
    'editorial',
    'cinematic',
    'portrait',
    'minimalist',
    'stage',
    'studio',
  ]);
  assert.deepEqual(TEMPLATES.map(({ name }) => name), [
    'Screen Presence',
    'Cinematic Showcase',
    'Portrait Edition',
    'Creative Practice',
    'Stage Presence',
    'Studio Portfolio',
  ]);
  assert.ok(TEMPLATES.every(({ description }) => description.length > 20));
  assert.equal(LEGACY_TEMPLATE_ID_MAP.polaroid, 'portrait');
  assert.equal(getTemplate('polaroid').id, 'portrait');
  for (const template of TEMPLATES) {
    assert.equal(getTemplate(template.id).id, template.id);
  }
});

test('preview data prefers local unsaved values while retaining stored sections', () => {
  const stored: ProfilePreviewData = {
    headshotUrl: '/portrait.jpg',
    displayName: 'Stored Name',
    roles: ['Actor'],
    city: 'Miami',
    state: 'FL',
    bio: 'Stored biography',
    languages: ['en'],
    skills: ['Dance'],
    demoReelUrl: '',
    gallery: ['/gallery.jpg'],
    experience: [{ year: '2025', title: 'Stored credit' }],
    projects: [{ title: 'Stored project' }],
    recommendations: [],
    socialLinks: { instagram: '@stored' },
  };
  const preview = mergeProfilePreviewData(stored, {
    displayName: 'Unsaved Name',
    bio: 'Unsaved biography',
    skills: ['Dance', 'Voice'],
  });
  assert.equal(preview.displayName, 'Unsaved Name');
  assert.equal(preview.bio, 'Unsaved biography');
  assert.deepEqual(preview.skills, ['Dance', 'Voice']);
  assert.equal(preview.projects[0].title, 'Stored project');
  assert.equal(preview.headshotUrl, '/portrait.jpg');
});

test('template cards and full preview consume complete real profile data without an inline large preview', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  for (const field of [
    'headshotUrl', 'displayName', 'roles', 'city', 'state', 'bio', 'languages',
    'skills', 'demoReelUrl', 'gallery', 'experience', 'projects',
    'recommendations', 'socialLinks',
  ]) {
    assert.match(themeSource, new RegExp(field));
  }
  assert.match(themeSource, />\s*Customize Template\s*<span/);
  assert.match(themeSource, /href=\{`\/profile-preview\?template=/);
  assert.doesNotMatch(themeSource, /aria-label="Live profile preview"/);
});

test('Editorial and Cinematic previews use structurally distinct layouts', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  assert.match(themeSource, /data-template-layout="editorial-columns"/);
  assert.match(themeSource, /data-template-layout="cinematic-title-sequence"/);
  assert.match(themeSource, /columns-2/);
  assert.match(themeSource, /min-h-\[70vh\]/);
});

test('Free save gate rejects each Member template without changing persistence rules', () => {
  for (const template of TEMPLATES.filter(({ id }) => id !== 'editorial')) {
    assert.ok(getRequestedMemberFeatures({
      isMember: false,
      currentSlug: 'ava-stone',
      requestedSlug: 'ava-stone',
      requestedTheme: template.id,
      requestedAccent: 'coral',
      currentSkillCount: 3,
      skillCount: 3,
    }).includes('Profile theme'));
  }
});

test('selected profile template opens a dedicated real preview in a new tab', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  const routeSource = readFileSync(
    new URL('./src/app/profile-preview/page.tsx', import.meta.url),
    'utf8',
  );
  const previewSource = readFileSync(
    new URL('./src/components/ProfileTemplatePreviewPage.tsx', import.meta.url),
    'utf8',
  );
  assert.match(themeSource, /target="_blank"/);
  assert.match(themeSource, /rel="noreferrer"/);
  assert.match(themeSource, /PROFILE_TEMPLATE_PREVIEW_STORAGE_KEY/);
  assert.doesNotMatch(themeSource, /aria-modal="true"|fullPreviewOpen/);
  assert.match(routeSource, /ProfileTemplatePreviewPage/);
  assert.match(routeSource, /displayName: profile\.display_name/);
  assert.match(previewSource, /getAccent\(draft\.paletteId\)/);
  assert.match(previewSource, /CompleteProfileSite/);
});

test('profile preview omits empty sections, discovery modules, and keeps a minimal Magiora footer', () => {
  const themeSource = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  const previewRoute = readFileSync(
    new URL('./src/app/profile-preview/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(themeSource, /\{bio && <section/);
  assert.match(themeSource, /\{hasWork && <section/);
  assert.match(themeSource, /\{data\.recommendations\.length > 0 && <section/);
  assert.match(themeSource, /Hosted on Magiora/);
  assert.match(themeSource, /href="\/"/);
  assert.doesNotMatch(previewRoute, /Related Professionals|recommended|Directory/i);
});

test('Screen Presence navigation includes only sections with actual content', () => {
  const empty: ProfilePreviewData = {
    headshotUrl: null,
    displayName: 'Ava Stone',
    roles: ['Actor'],
    city: '',
    state: '',
    bio: '',
    languages: [],
    skills: [],
    demoReelUrl: '',
    gallery: [],
    experience: [],
    projects: [],
    recommendations: [],
    socialLinks: {},
  };
  assert.deepEqual(getScreenPresenceSections(empty), []);
  assert.deepEqual(
    getScreenPresenceSections({
      ...empty,
      bio: 'Professional biography',
      demoReelUrl: 'https://vimeo.com/123',
      experience: [{ production: 'Salt Line', role: 'Lead', year: '2025' }],
      skills: ['Screen acting'],
      gallery: ['/portrait.jpg'],
      socialLinks: { imdb: 'nm1234567' },
    }).map(({ id }) => id),
    ['about', 'gallery', 'reel', 'credits', 'practice', 'contact'],
  );
});

test('Screen Presence is a shared responsive renderer with reel, distinct credits, practice, and accessible links', () => {
  const renderer = readFileSync(
    new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url),
    'utf8',
  );
  const preview = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  const publicProfile = readFileSync(
    new URL('./src/app/m/[slug]/page.tsx', import.meta.url),
    'utf8',
  );
  assert.equal(renderer.match(/\{data\.bio\}/g)?.length, 1);
  assert.match(renderer, /<VideoEmbed url=\{data\.demoReelUrl\}/);
  assert.match(renderer, /id="credits"/);
  assert.match(renderer, /id="practice"/);
  assert.match(renderer, /getScreenPresenceSections\(data, resolvedSettings\.sectionOrder\)/);
  assert.match(renderer, /target="_blank" rel="noreferrer"/);
  assert.match(renderer, /<SocialLinksList/);
  assert.match(renderer, /text-center/);
  assert.match(renderer, /aria-label="Open Magiora Home in a new tab"/);
  assert.match(renderer, /aspect-\[4\/5\]/);
  assert.match(renderer, /object-\[50%_22%\]/);
  assert.match(renderer, /aspect-\[4\/3\]/);
  assert.match(renderer, /sm:grid-cols-2|md:grid-cols-2/);
  assert.match(preview, /<ScreenPresenceProfile data=\{data\} accent=\{accent\}/);
  assert.match(publicProfile, /<ScreenPresenceProfile data=\{screenData\} accent=\{accent\}/);
});

test('Screen Presence refinement uses concise roles, conditional CTAs, explicit production links, and a keyboard lightbox', () => {
  const renderer = readFileSync(
    new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url),
    'utf8',
  );
  const lightbox = readFileSync(
    new URL('./src/components/ProfileGalleryLightbox.tsx', import.meta.url),
    'utf8',
  );
  assert.match(renderer, /data\.roles\.join\(' \/ '\)/);
  assert.doesNotMatch(renderer, /working across/);
  assert.match(renderer, /data\.demoReelUrl && <HeroAction href="#reel" label="Watch reel"/);
  assert.match(renderer, /data\.gallery\.length > 0 && <HeroAction href="#gallery" label="Gallery"/);
  assert.match(renderer, /matchingCredit\?\.role/);
  assert.match(renderer, /View on IMDb ↗/);
  assert.match(renderer, /Official website ↗/);
  assert.match(renderer, /View project →/);
  assert.match(renderer, /target="_blank" rel="noreferrer"/);
  assert.match(renderer, /<ProfileGalleryLightbox/);
  assert.match(lightbox, /role="dialog"/);
  assert.match(lightbox, /aria-modal="true"/);
  assert.match(lightbox, /event\.key === 'Escape'/);
  assert.match(lightbox, /event\.key === 'ArrowLeft'/);
  assert.match(lightbox, /event\.key === 'ArrowRight'/);
  assert.match(lightbox, /event\.key !== 'Tab'/);
  assert.match(lightbox, /triggerRefs\.current\[returnTo\]\?\.focus/);
});

test('templates declare supported palettes and preserve unsupported historical combinations for review', () => {
  for (const template of TEMPLATES) {
    assert.ok(template.supportedAccents.length > 0, `${template.name} palettes`);
    assert.equal(getSupportedAccents(template.id).length, template.supportedAccents.length);
  }
  assert.deepEqual(getSupportedAccents('editorial').map(({ id }) => id), [
    'coral',
    'monochrome',
    'forest',
    'ocean',
  ]);
  assert.equal(isTemplateAccentSupported('editorial', 'sunset'), false);

  const selector = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  assert.match(selector, /unsupportedSelection/);
  assert.match(selector, /combination is no longer recommended/);
  assert.match(selector, /supportedAccents\.map/);
  assert.match(selector, /aria-pressed=\{accent === item\.id\}/);
  assert.match(selector, /template=\$\{encodeURIComponent\(template\)\}[\s\S]*accent=\$\{encodeURIComponent\(accent\)\}/);
  assert.match(selector, /Portfolio website/);
  assert.match(selector, /displayName|const name = data\.displayName/);
});

test('Screen Presence card owns palette and real-preview controls without nested interactions', () => {
  const selector = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  assert.match(selector, /data-screen-presence-card/);
  assert.match(selector, /data-screen-presence-controls/);
  assert.match(selector, /getSupportedAccents\(item\.id\)\.map/);
  assert.match(selector, /onClick=\{\(\) => setTemplateAccent\(item\.id, palette\.id\)\}/);
  assert.match(selector, /aria-pressed=\{itemAccentId === palette\.id\}/);
  assert.match(selector, /Use \$\{palette\.name\} palette for Screen Presence/);
  assert.match(selector, /profile-preview\?template=\$\{encodeURIComponent\(item\.id\)\}&accent=/);
  assert.match(selector, /storePreviewPayload\(item\.id,/);
  assert.match(selector, /target="_blank"/);
  assert.match(selector, /rel="noreferrer"/);
  assert.match(selector, /Customize Template <span aria-hidden="true">\{SectionIcons\.externalLink\}/);
});

test('Screen Presence exposes credit-first roles, gallery affordance, and accessible email copying', () => {
  const renderer = readFileSync(
    new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url),
    'utf8',
  );
  const lightbox = readFileSync(
    new URL('./src/components/ProfileGalleryLightbox.tsx', import.meta.url),
    'utf8',
  );
  const email = readFileSync(
    new URL('./src/components/ProfileEmailContact.tsx', import.meta.url),
    'utf8',
  );
  assert.match(renderer, /project\.creditRoles\?\.length/);
  assert.match(renderer, /\[project\.year \|\| matchingCredit\?\.year, productionRole\]/);
  assert.match(lightbox, /cursor-zoom-in/);
  assert.match(lightbox, /group-hover:opacity-90/);
  assert.match(lightbox, /group-focus-visible:opacity-90/);
  assert.match(renderer, /<ProfileEmailContact email=\{data\.contactEmail\}/);
  assert.match(email, /navigator\.clipboard\?\.writeText/);
  assert.match(email, /document\.execCommand\('copy'\)/);
  assert.match(email, /aria-label=\{`Copy email address \$\{email\}`\}/);
  assert.match(email, /aria-live="polite"/);
  assert.match(email, /Email address copied/);
  assert.match(email, /window\.setTimeout\(\(\) => setCopied\(false\), 1800\)/);
});

test('Screen Presence preview switches among four named palettes locally', () => {
  const preview = readFileSync(
    new URL('./src/components/ProfileTemplatePreviewPage.tsx', import.meta.url),
    'utf8',
  );
  assert.match(preview, /isScreenPresence = draft\.templateId === 'editorial'/);
  assert.match(preview, /getSupportedAccents\('editorial'\)\.map/);
  assert.match(preview, /palette\.name/);
  assert.match(preview, /palette\.accent, palette\.accentSoft, palette\.surface/);
  assert.match(preview, /setDraft\(\(current\) => \(\{ \.\.\.current, paletteId: palette\.id \}\)\)/);
  assert.match(preview, /aria-pressed=\{draft\.paletteId === palette\.id\}/);
  assert.match(preview, /fixed bottom-3/);
  assert.doesNotMatch(preview, /localStorage\.setItem/);
  assert.deepEqual(getSupportedAccents('editorial').map((palette) => palette.name), [
    'Coral',
    'Monochrome',
    'Forest',
    'Ocean',
  ]);
});

test('Screen Presence gallery and navigation precede reel and omit empty sections', () => {
  const renderer = readFileSync(
    new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(renderer.indexOf('id="gallery"') < renderer.indexOf('id="reel"'));

  const complete: ProfilePreviewData = {
    headshotUrl: null,
    displayName: 'Artist',
    roles: ['Director'],
    city: '',
    state: '',
    bio: 'Biography',
    languages: [],
    skills: ['Editing'],
    gallery: ['/gallery.jpg'],
    demoReelUrl: 'https://vimeo.com/1',
    projects: [{ title: 'Production' }],
    experience: [{ production: 'Production', role: 'Director' }],
    recommendations: [{ quote: 'Excellent.' }],
    socialLinks: {},
    equipment: [],
    contactEmail: 'artist@example.com',
    websiteUrl: '',
  };
  assert.deepEqual(
    getScreenPresenceSections(complete).map((section) => section.id),
    ['about', 'gallery', 'reel', 'work', 'credits', 'practice', 'recommendations', 'contact'],
  );
});

test('template palette state is isolated and preview resolves the selected template palette', () => {
  const selector = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );
  assert.match(selector, /paletteByTemplate/);
  assert.match(selector, /Record<TemplateId, AccentId>/);
  assert.match(selector, /\[templateId\]: nextAccent/);
  assert.match(selector, /const accent = paletteByTemplate\[template\]/);
  assert.match(selector, /const itemAccentId = paletteByTemplate\[item\.id\]/);
  assert.match(selector, /storePreviewPayload\(item\.id, itemAccentId\)/);
  assert.match(selector, /value=\{accent\}/);
});

test('multiple credits on one project aggregate into stable deduplicated roles', () => {
  const projects = aggregatePreviewProjects([
    { slug: 'salt-line', title: 'Salt Line', year: 2026, creditRole: 'Director' },
    { slug: 'salt-line', title: 'Salt Line', year: 2026, creditRole: 'Writer' },
    { slug: 'salt-line', title: 'Salt Line', year: 2026, creditRole: 'Director' },
  ]);
  assert.equal(projects.length, 1);
  assert.deepEqual(projects[0].creditRoles, ['Director', 'Writer']);
  const renderer = readFileSync(new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url), 'utf8');
  assert.match(renderer, /Array\.from\(new Set\(productionRoles\)\)\.join\(' \/ '\)/);
  assert.match(renderer, /View on IMDb/);
  assert.match(renderer, /Official website/);
  assert.match(renderer, /View project/);
});

test('Screen Presence settings resolve local, saved, legacy, and defaults in priority order', () => {
  const saved = {
    template_id: 'editorial',
    palette_id: 'forest',
    font_style: 'classic',
    section_order: ['gallery', 'about'],
    hidden_sections: [],
  };
  assert.equal(resolveProfileTemplateSettings({
    local: { paletteId: 'ocean' },
    saved,
    legacyTemplate: 'editorial',
    legacyAccent: 'coral',
  }).paletteId, 'ocean');
  assert.equal(resolveProfileTemplateSettings({ saved, legacyAccent: 'coral' }).paletteId, 'forest');
  assert.equal(resolveProfileTemplateSettings({
    legacyTemplate: 'editorial',
    legacyAccent: 'monochrome',
  }).paletteId, 'monochrome');
  assert.equal(resolveProfileTemplateSettings({}).paletteId, 'coral');
});

test('section normalization and move controls remain deterministic', () => {
  assert.deepEqual(normalizeSectionOrder(['gallery', 'unknown', 'about', 'gallery']), [
    'gallery', 'about', 'reel', 'work', 'credits', 'practice', 'recommendations', 'contact',
  ]);
  assert.deepEqual(moveSection([...SCREEN_PRESENCE_SECTIONS], 'gallery', -1).slice(0, 2), [
    'gallery', 'about',
  ]);
  assert.deepEqual(moveSection([...SCREEN_PRESENCE_SECTIONS], 'about', -1), [...SCREEN_PRESENCE_SECTIONS]);
});

test('typography systems and persistent editor use validated Member-only settings', () => {
  assert.deepEqual(TYPOGRAPHY_SYSTEMS.map((system) => system.name), [
    'Editorial', 'Modern', 'Classic', 'Contemporary',
  ]);
  assert.equal(isTypographyStyle('modern'), true);
  assert.equal(isTypographyStyle('comic'), false);
  const action = readFileSync(new URL('./src/app/dashboard/profile/actions.ts', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('./src/components/ProfileTemplatePreviewPage.tsx', import.meta.url), 'utf8');
  assert.match(action, /hasPaidMembership\(user\.id\)/);
  assert.match(action, /Template customization is available with Member/);
  assert.match(action, /profile_template_settings/);
  assert.match(editor, /DndContext/);
  assert.match(editor, /PointerSensor/);
  assert.match(editor, /KeyboardSensor/);
  assert.match(editor, /sortableKeyboardCoordinates/);
  assert.match(editor, /saveTemplateSettings/);
  assert.match(editor, /CompleteProfileSite/);
});

test('full-screen customizer keeps live settings local until an explicit Member save', () => {
  const customizer = readFileSync(
    new URL('./src/components/ProfileTemplatePreviewPage.tsx', import.meta.url),
    'utf8',
  );
  const route = readFileSync(
    new URL('./src/app/profile-preview/page.tsx', import.meta.url),
    'utf8',
  );
  const publicProfile = readFileSync(
    new URL('./src/app/m/[slug]/page.tsx', import.meta.url),
    'utf8',
  );

  assert.match(customizer, /aria-label="Screen Presence customization controls"/);
  assert.match(customizer, /role="tablist"/);
  assert.match(customizer, /\['colors', 'typography', 'sections'\]/);
  assert.match(customizer, /setDraft\(\(current\) => \(\{ \.\.\.current, paletteId: palette\.id \}\)\)/);
  assert.match(customizer, /setDraft\(\(current\) => \(\{ \.\.\.current, fontStyle: system\.id \}\)\)/);
  assert.match(customizer, /arrayMove\(current\.sectionOrder, from, to\)/);
  assert.match(customizer, /PointerSensor/);
  assert.match(customizer, /KeyboardSensor/);
  assert.match(customizer, /sortableKeyboardCoordinates/);
  assert.match(customizer, /JSON\.stringify\(draft\) !== JSON\.stringify\(savedSettings\)/);
  assert.match(customizer, /window\.addEventListener\('beforeunload', warn\)/);
  assert.match(customizer, /setDraft\(savedSettings\)/);
  assert.match(customizer, /disabled=\{!dirty \|\| isPending\}/);
  assert.match(customizer, /if \(!isMember\)/);
  assert.match(customizer, /saveTemplateSettings\(\{[\s\S]*paletteId: draft\.paletteId,[\s\S]*fontStyle: draft\.fontStyle,[\s\S]*sectionOrder: draft\.sectionOrder/);
  assert.match(customizer, /if \(result\.ok\) setSavedSettings\(draft\)/);
  assert.match(customizer, /<CompleteProfileSite[\s\S]*settings=\{draft\}/);
  assert.match(route, /if \(!user\) redirect\('\/login'\)/);
  assert.match(route, /hasMemberEntitlement\(user\.id\)/);
  assert.doesNotMatch(publicProfile, /customization controls|ProfileTemplatePreviewPage/);
});

test('Screen Presence footer opens Magiora Home in a new tab', () => {
  const renderer = readFileSync(new URL('./src/components/ScreenPresenceProfile.tsx', import.meta.url), 'utf8');
  assert.match(renderer, /href="\/" target="_blank" rel="noreferrer"/);
  assert.match(renderer, /aria-label="Open Magiora Home in a new tab"/);
  assert.match(renderer, /Hosted on Magiora/);
});

test('Member entitlement consistently accepts the profile plan and active subscriptions', () => {
  assert.deepEqual(resolveMemberEntitlement({ plan: 'member' }), {
    isMember: true,
    source: 'profile_plan',
  });
  assert.deepEqual(resolveMemberEntitlement({
    plan: 'listed',
    subscriptionStatus: 'active',
    currentPeriodEnd: new Date(Date.now() + 60_000).toISOString(),
  }), {
    isMember: true,
    source: 'subscription',
  });
  assert.equal(resolveMemberEntitlement({
    plan: 'listed',
    subscriptionStatus: 'past_due',
  }).isMember, false);

  const serverResolver = readFileSync(
    new URL('./src/lib/memberEntitlementServer.ts', import.meta.url),
    'utf8',
  );
  const profilePage = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );
  const profileActions = readFileSync(
    new URL('./src/app/dashboard/profile/actions.ts', import.meta.url),
    'utf8',
  );
  assert.match(serverResolver, /select\('plan'\)/);
  assert.match(serverResolver, /resolveMemberEntitlement/);
  assert.match(profilePage, /memberEntitlementServer/);
  assert.match(profileActions, /memberEntitlementServer/);
});

test('active Member profile presentation uses warm benefits without upgrade treatment', () => {
  const memberEdition = readFileSync(
    new URL('./src/components/MemberEdition.tsx', import.meta.url),
    'utf8',
  );
  const notice = readFileSync(
    new URL('./src/components/MemberBenefitNotice.tsx', import.meta.url),
    'utf8',
  );
  const profilePage = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );
  const gallery = readFileSync(
    new URL('./src/app/dashboard/profile/ProfileMediaSection.tsx', import.meta.url),
    'utf8',
  );
  const videos = readFileSync(
    new URL('./src/components/VideoLinksManager.tsx', import.meta.url),
    'utf8',
  );
  const slug = readFileSync(
    new URL('./src/components/SlugEditor.tsx', import.meta.url),
    'utf8',
  );
  const themes = readFileSync(
    new URL('./src/components/ThemeSelector.tsx', import.meta.url),
    'utf8',
  );

  assert.match(memberEdition, /\{isMember \? \(/);
  assert.match(memberEdition, /bg-\[#FBF7EC\]/);
  assert.match(memberEdition, /\{!isMember && \(/);
  assert.match(memberEdition, /Unlock Member/);
  assert.match(notice, /bg-\[#F7F0DE\]/);
  assert.match(profilePage, /\{isMember && \([\s\S]*Member/);
  assert.match(profilePage, /Unlimited skills/);
  assert.match(gallery, /You can publish up to \$\{MEMBER_PROFILE_GALLERY_LIMIT\} gallery images/);
  assert.match(gallery, /\$\{gallery\.length\} of \$\{MEMBER_PROFILE_GALLERY_LIMIT\} images used/);
  assert.match(videos, /\$\{links\.length\} of \$\{MAX_EXTRA\} additional portfolio videos used/);
  assert.match(slug, /Custom profile URL included with Member/);
  assert.match(themes, /Template customization included with Member/);
  assert.equal(FREE_PROFILE_GALLERY_LIMIT, 3);
  assert.equal(MEMBER_PROFILE_GALLERY_LIMIT, 10);
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

test('workspace navigation keeps Casting and Applications inside dashboard routes', () => {
  const navSource = readFileSync(
    new URL('./src/components/Nav.tsx', import.meta.url),
    'utf8',
  );
  const dashboardSource = readFileSync(
    new URL('./src/app/dashboard/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(navSource, /href: '\/dashboard\/casting', label: 'Casting'/);
  assert.match(navSource, /activePrefixes: \['\/casting-calls'\]/);
  assert.match(navSource, /href: '\/dashboard\/applications', label: 'Applications'/);
  assert.match(dashboardSource, /href="\/dashboard\/casting"/);
});

test('casting workspace exposes applications, shared browse, and a future saved structure', () => {
  const castingSource = readFileSync(
    new URL('./src/app/dashboard/casting/page.tsx', import.meta.url),
    'utf8',
  );
  const browseSource = readFileSync(
    new URL('./src/app/dashboard/casting/browse/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(castingSource, /My Applications/);
  assert.match(castingSource, /Browse Casting Calls/);
  assert.match(castingSource, /Saved Casting Calls/);
  assert.match(castingSource, /Coming later/);
  assert.match(browseSource, /CastingCatalogue/);
  assert.match(browseSource, /pathname="\/dashboard\/casting\/browse"/);
});

test('workspace casting details preserve dashboard navigation through apply redirects', () => {
  const detailSource = readFileSync(
    new URL('./src/app/casting-calls/[id]/page.tsx', import.meta.url),
    'utf8',
  );
  const actionSource = readFileSync(
    new URL('./src/app/dashboard/casting-calls/actions.ts', import.meta.url),
    'utf8',
  );
  const applicationSource = readFileSync(
    new URL('./src/app/dashboard/applications/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(detailSource, /query\.workspace === '1' \? 'dashboard' : 'public'/);
  assert.match(detailSource, /workspace_context/);
  assert.match(actionSource, /workspaceSuffix/);
  assert.match(applicationSource, /\/dashboard\/casting\/browse/);
  assert.match(applicationSource, /\?workspace=1/);
});

test('public navigation ends with Pricing and removes the redundant applications shortcut', () => {
  const nav = readFileSync(new URL('./src/components/Nav.tsx', import.meta.url), 'utf8');
  const mobile = readFileSync(new URL('./src/components/NavMobileMenu.tsx', import.meta.url), 'utf8');
  const spotlightIndex = nav.indexOf("{ href: '/stories', label: 'Spotlight' }");
  const castingIndex = nav.indexOf("{ href: '/casting-calls', label: 'Casting' }");
  const pricingIndex = nav.indexOf("{ href: '/pricing', label:");

  assert.ok(spotlightIndex < castingIndex);
  assert.ok(castingIndex < pricingIndex);
  assert.match(nav, /icon: SectionIcons\.pricing/);
  assert.doesNotMatch(nav, />\s*My Applications\s*</);
  assert.doesNotMatch(mobile, />\s*My Applications\s*</);
  assert.match(nav, /href="\/dashboard"/);
});

test('profile polish keeps the Free gallery clear and the public-profile action accessible', () => {
  const media = readFileSync(
    new URL('./src/app/dashboard/profile/ProfileMediaSection.tsx', import.meta.url),
    'utf8',
  );
  const profile = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );
  const dashboard = readFileSync(
    new URL('./src/app/dashboard/page.tsx', import.meta.url),
    'utf8',
  );
  const card = readFileSync(
    new URL('./src/components/DashboardCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(media, /getProfileGalleryPresentation\(gallery\.length, isMember\)/);
  assert.match(media, /\{canUpload && \(/);
  assert.match(media, /Expand your gallery/);
  assert.match(media, /Your first 3 gallery images are public\. Member lets you publish up to 10\./);
  assert.match(profile, /label="Equipment"/);
  assert.match(profile, /Professional equipment you can bring to a production/);
  assert.match(profile, /title="Professional Work"/);
  assert.match(profile, /Projects, credits, demo reel and recommendations/);
  assert.match(dashboard, /label: 'View Public Profile',\s+newTab: true/);
  assert.match(card, /target=\{secondaryAction\.newTab \? '_blank'/);
  assert.match(card, /opens in a new tab/);
  assert.match(card, /SectionIcons\.externalLink/);
});

test('Free gallery exposes uploads below three and blocks them at the included limit', () => {
  const empty = getProfileGalleryPresentation(0, false);
  const twoImages = getProfileGalleryPresentation(2, false);
  const threeImages = getProfileGalleryPresentation(3, false);
  const historicalImages = getProfileGalleryPresentation(4, false);

  assert.deepEqual(empty, {
    uploadLimit: 3,
    includedCount: 0,
    canUpload: true,
    showMemberBenefit: true,
  });
  assert.equal(twoImages.includedCount, 2);
  assert.equal(twoImages.canUpload, true);
  assert.equal(twoImages.showMemberBenefit, true);
  assert.equal(threeImages.includedCount, 3);
  assert.equal(threeImages.canUpload, false);
  assert.equal(threeImages.showMemberBenefit, true);
  assert.equal(historicalImages.includedCount, 3);
  assert.equal(historicalImages.canUpload, false);
  assert.equal(canAddProfileGalleryFiles(2, 1, false), true);
  assert.equal(canAddProfileGalleryFiles(2, 2, false), false);
  assert.equal(canAddProfileGalleryFiles(4, 1, false), false);
});

test('Member gallery retains ten-image uploads without an Unlock Member CTA', () => {
  const member = getProfileGalleryPresentation(9, true);
  const fullMember = getProfileGalleryPresentation(10, true);
  const media = readFileSync(
    new URL('./src/app/dashboard/profile/ProfileMediaSection.tsx', import.meta.url),
    'utf8',
  );
  const memberEdition = readFileSync(
    new URL('./src/components/MemberEdition.tsx', import.meta.url),
    'utf8',
  );

  assert.equal(member.uploadLimit, 10);
  assert.equal(member.includedCount, 9);
  assert.equal(member.canUpload, true);
  assert.equal(member.showMemberBenefit, false);
  assert.equal(fullMember.canUpload, false);
  assert.match(media, /isMember \? \(/);
  assert.match(media, /title="Member capacity"/);
  assert.match(media, /MEMBER_PROFILE_GALLERY_LIMIT/);
  assert.match(memberEdition, /\{!isMember && \(/);
});

test('Profile Status preview uses the shared external-link treatment in a new tab', () => {
  const profile = readFileSync(
    new URL('./src/app/dashboard/profile/page.tsx', import.meta.url),
    'utf8',
  );

  assert.match(profile, /View preview/);
  assert.match(profile, /target="_blank"/);
  assert.match(profile, /rel="noreferrer"/);
  assert.match(profile, /aria-label="View public profile preview \(opens in a new tab\)"/);
  assert.match(profile, /SectionIcons\.externalLink/);
  assert.match(profile, /focus-visible:outline/);
});

test('Experience reference validation accepts only approved web destinations', () => {
  for (const value of [
    'https://imdb.com/title/tt1234567',
    'https://www.imdb.com/title/tt1234567',
    'https://m.imdb.com/title/tt1234567',
    'https://pro.imdb.com/title/tt1234567',
  ]) {
    assert.equal(validateExperienceReference('imdb', value).valid, true);
  }

  assert.deepEqual(
    validateExperienceReference('imdb', 'https://example.com/title/tt1234567'),
    { valid: false, error: INVALID_IMDB_MESSAGE },
  );
  assert.equal(
    validateExperienceReference('imdb', 'http://www.imdb.com/title/tt1234567').valid,
    true,
  );
  assert.deepEqual(
    validateExperienceReference('imdb', 'not a URL'),
    { valid: false, error: INVALID_IMDB_MESSAGE },
  );
  assert.equal(
    validateExperienceReference('official', 'https://festival.example/films/salt-line').valid,
    true,
  );
});

test('Experience official websites reject video, social, and blocked subdomains', () => {
  for (const hostname of [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'vimeo.com',
    'www.vimeo.com',
    'dailymotion.com',
    'tiktok.com',
    'instagram.com',
    'facebook.com',
    'portfolio.youtube.com',
    'press.instagram.com',
  ]) {
    assert.deepEqual(
      validateExperienceReference('official', `https://${hostname}/example`),
      { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
    );
  }
  assert.deepEqual(
    validateExperienceReference('official', 'youtube.com/watch?v=blocked'),
    { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
  );
  assert.equal(
    validateExperienceReference('official', 'http://official-film.example').valid,
    true,
  );
  assert.deepEqual(
    validateExperienceReference('official', 'javascript:alert(1)'),
    { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
  );
  assert.deepEqual(
    validateExperienceReference('official', 'data:text/html,blocked'),
    { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
  );
  assert.deepEqual(
    validateExperienceReference('official', 'file:///tmp/blocked'),
    { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
  );
  assert.deepEqual(
    validateExperienceReference('official', 'not a URL'),
    { valid: false, error: INVALID_OFFICIAL_WEBSITE_MESSAGE },
  );
});

test('Experience reference URLs add HTTPS only when no scheme is provided', () => {
  const cases = [
    ['example.com', 'https://example.com/'],
    ['www.example.com/about', 'https://www.example.com/about'],
    ['https://example.com', 'https://example.com/'],
    ['http://example.com', 'http://example.com/'],
  ] as const;
  for (const [input, expected] of cases) {
    const result = validateExperienceReference('official', input);
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.normalizedUrl, expected);
  }
});

test('Experience URL guidance and non-blocking HTTP notice are rendered', () => {
  const editor = readFileSync(
    new URL('./src/components/ExperienceEditor.tsx', import.meta.url),
    'utf8',
  );
  assert.match(editor, /You can enter a full URL or simply type the website address\./);
  assert.match(editor, /If no protocol is provided, Magiora will automatically use HTTPS\./);
  assert.match(editor, /This website uses an unsecured HTTP connection\./);
  assert.match(editor, /role="status"/);
  assert.doesNotMatch(editor, /type="url"/);
});

test('legacy Experience references remain preserved without becoming portfolio videos', () => {
  const legacy = {
    year: '2021',
    title: 'Historical credit',
    role: 'Director',
    link: 'https://vimeo.com/123456',
  };
  const normalized = normalizeExperienceForEditor(legacy);
  const preserved = preserveSubmittedExperience([normalized], [legacy]);

  assert.equal(normalized.reference_type, 'legacy');
  assert.equal(normalized.link, legacy.link);
  assert.equal(preserved[0]?.link, legacy.link);
  assert.equal(getExperienceReferencePresentation(legacy), null);
  assert.throws(
    () => preserveSubmittedExperience([{ ...legacy, link: 'https://youtu.be/new-video' }], [legacy]),
    new RegExp(INVALID_OFFICIAL_WEBSITE_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});

test('profile product copy and public Experience rendering stay purpose-specific', () => {
  const media = readFileSync(
    new URL('./src/app/dashboard/profile/ProfileMediaSection.tsx', import.meta.url),
    'utf8',
  );
  const videos = readFileSync(
    new URL('./src/components/VideoLinksManager.tsx', import.meta.url),
    'utf8',
  );
  const publicProfile = readFileSync(
    new URL('./src/app/m/[slug]/page.tsx', import.meta.url),
    'utf8',
  );
  const actions = readFileSync(
    new URL('./src/app/dashboard/profile/actions.ts', import.meta.url),
    'utf8',
  );

  assert.match(media, /Your first 3 gallery images are public\. Member lets you publish up to 10\./);
  assert.match(videos, /Add up to 4 additional portfolio videos\./);
  assert.doesNotMatch(videos, /labeled scenes/i);
  assert.match(videos, />\s*Clip title\s*</);
  assert.match(videos, />\s*Portfolio video URL\s*</);
  assert.match(publicProfile, /getExperienceReferencePresentation/);
  assert.match(publicProfile, /reference\.label/);
  assert.doesNotMatch(publicProfile, /<VideoEmbed url=\{experience/);
  assert.match(actions, /preserveSubmittedExperience\(experienceRaw, existingExperience\)/);
});

test('valid Experience replacements remove legacy state and the historical URL', () => {
  const legacy = {
    production: 'Historical credit',
    role: 'Director',
    link: 'https://youtube.com/watch?v=legacy',
    reference_type: 'legacy',
  };
  for (const replacement of [
    { reference_type: 'imdb' as const, reference_url: 'https://www.imdb.com/title/tt1234567/' },
    { reference_type: 'official' as const, reference_url: 'https://historical-film.example/press' },
  ]) {
    const edited = { ...legacy, ...replacement };
    assert.equal(getLegacyExperienceReference(edited), null);
    const [saved] = preserveSubmittedExperience([edited], [legacy]);
    assert.equal(saved.link, undefined);
    assert.equal(saved.reference_type, replacement.reference_type);
    assert.equal(getExperienceReferencePresentation(saved)?.href, replacement.reference_url);
  }
});

test('invalid Experience replacement preserves the legacy reference', () => {
  const legacy = {
    production: 'Historical credit',
    link: 'https://vimeo.com/123456',
    reference_type: 'legacy',
  };
  const invalid = {
    ...legacy,
    reference_type: 'official',
    reference_url: 'https://youtube.com/watch?v=replacement',
  };
  assert.equal(getLegacyExperienceReference(invalid), legacy.link);
  assert.throws(
    () => preserveSubmittedExperience([invalid], [legacy]),
    new RegExp(INVALID_OFFICIAL_WEBSITE_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.equal(legacy.link, 'https://vimeo.com/123456');
});

test('Free saves retain Member-created skills, videos, themes, and palettes while limiting active content', () => {
  const skills = ['Acting', 'Voice', 'Dance', 'Movement', 'Comedy', 'Stunts', 'Writing', 'Directing'];
  const savedSkills = retainProfileSkills(skills, skills, false);
  assert.deepEqual(savedSkills, skills);
  assert.deepEqual(getActiveProfileSkills(savedSkills, false), skills.slice(0, 5));

  const videos = [
    { label: 'Scene one', url: 'https://vimeo.com/1' },
    { label: 'Scene two', url: 'https://vimeo.com/2' },
  ];
  assert.deepEqual(retainProfileVideos(videos, [], false), videos);
  assert.deepEqual(getActiveProfileVideos(videos, false), []);
  assert.equal(retainMemberSelection('cinematic', 'editorial', ['editorial', 'cinematic'], false, 'editorial'), 'cinematic');
  assert.equal(retainMemberSelection('ocean', 'coral', ['coral', 'ocean'], false, 'coral'), 'ocean');
});

test('manipulated Free submissions cannot activate extra skills and preserved skills do not block ordinary saves', () => {
  const existing = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  const stored = retainProfileSkills(existing, [...existing, 'Nine'], false);
  assert.equal(getActiveProfileSkills(stored, false).length, 5);
  assert.ok(!getActiveProfileSkills(stored, false).includes('Nine'));
  assert.deepEqual(getRequestedMemberFeatures({
    isMember: false,
    currentSlug: 'ava-stone',
    requestedSlug: 'ava-stone',
    requestedTheme: 'editorial',
    requestedAccent: 'coral',
    currentSkillCount: 8,
    skillCount: 8,
  }), []);
});

test('profile gallery retains owner content while Free publication remains limited to three', () => {
  const presentation = getProfileGalleryPresentation(10, false);
  assert.equal(presentation.includedCount, 3);
  assert.equal(10 - presentation.includedCount, 7);
  assert.equal(presentation.canUpload, false);
});

test('profile-domain preview remains branded without changing canonical path routing', () => {
  assert.equal(getProfileDomainPreview('andres'), 'andres.magiora.com');
  assert.equal(getBrandDisplayDomain('preview-123.vercel.app'), 'magiora.com');
  assert.equal(getProfileDomainPreview('andres', 'localhost:3000'), 'andres.magiora.com');
  assert.equal(getProfileDomainPreview('andres', 'https://www.magiora.example/path'), 'andres.magiora.example');

  const slugEditor = readFileSync(new URL('./src/components/SlugEditor.tsx', import.meta.url), 'utf8');
  const profilePage = readFileSync(new URL('./src/app/m/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.match(slugEditor, /once custom domains are activated/);
  assert.match(profilePage, /const pathname = `\/m\/\$\{encodeURIComponent\(slug\)\}`/);
});

test('retention copy and equipment example are explicit and accessible', () => {
  const equipment = readFileSync(new URL('./src/components/EquipmentEditor.tsx', import.meta.url), 'utf8');
  const media = readFileSync(new URL('./src/app/dashboard/profile/ProfileMediaSection.tsx', import.meta.url), 'utf8');
  const videos = readFileSync(new URL('./src/components/VideoLinksManager.tsx', import.meta.url), 'utf8');
  assert.match(equipment, /ARRI Alexa Mini/);
  assert.match(media, /Preserved with Member/);
  assert.match(videos, /Preserved with Member/);
});
