import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DASHBOARD_EMPTY_STATES,
  computeDashboardCompleteness,
  getDashboardQuickActions,
  getPublicProfileState,
  mergeDashboardProjects,
  selectAuthorizedCastingActivity,
} from '../src/lib/dashboardFoundation.ts';

test('profile completeness is transparent for empty, partial, and complete profiles', () => {
  const empty = computeDashboardCompleteness({});
  assert.equal(empty.percent, 0);
  assert.equal(empty.missing.length, 10);
  assert.equal(empty.completed, 0);

  const partial = computeDashboardCompleteness({ display_name: 'Ava Stone', role_titles: ['Actor'] });
  assert.equal(partial.percent, 20);
  assert.deepEqual(partial.missing.slice(0, 2).map((item) => item.key), ['portrait', 'location']);

  const complete = computeDashboardCompleteness({
    display_name: 'Ava Stone',
    headshot_url: 'https://example.com/photo.jpg',
    role_titles: ['Actor'],
    location_city: 'New York',
    bio: 'A'.repeat(80),
    languages: ['en'],
    skills: ['Acting'],
    gallery: ['https://example.com/still.jpg'],
    experience: [{ title: 'A production' }],
    website_url: 'https://example.com',
  });
  assert.equal(complete.percent, 100);
  assert.equal(complete.missing.length, 0);
});

test('quick actions reflect missing profile work and public visibility', () => {
  const profile = { display_name: 'Ava', slug: 'ava', visible: true, approved: true };
  const actions = getDashboardQuickActions(profile, computeDashboardCompleteness(profile));
  assert.deepEqual(actions.slice(0, 3).map((action) => action.key), ['portrait', 'role', 'location']);
  assert.ok(actions.some((action) => action.key === 'public-profile'));
  assert.ok(actions.every((action) => action.label !== 'Complete profile'));
});

test('project relationships are merged without duplicate projects', () => {
  const project = { id: 'p1', slug: 'one', title: 'One', status: 'production', visible: true };
  const merged = mergeDashboardProjects(
    [project],
    [{ project, role_title: 'Director' }, { project, role_title: 'Producer' }],
  );
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].relationships, ['owner', 'credited']);
  assert.equal(merged[0].nextLabel, 'Manage project');
});

test('casting activity excludes applications belonging to another user', () => {
  const call = { id: 'c1', project_title: 'Film', role_name: 'Lead', status: 'open' };
  const activity = selectAuthorizedCastingActivity([
    { id: 'a1', applicant_id: 'me', status: 'shortlisted', created_at: '2026-01-02', casting_call: call },
    { id: 'a2', applicant_id: 'other', status: 'cast', created_at: '2026-01-03', casting_call: call },
  ], 'me');
  assert.deepEqual(activity.map((item) => item.id), ['a1']);
});

test('profile preview visibility mirrors the public route requirements', () => {
  assert.deepEqual(getPublicProfileState({ slug: 'ava', visible: true, approved: true }), {
    label: 'Public', canView: true,
  });
  assert.equal(getPublicProfileState({ slug: 'ava', visible: false, approved: true }).label, 'Private');
  assert.equal(getPublicProfileState({ slug: 'ava', visible: true, approved: false }).label, 'Awaiting approval');
  assert.equal(getPublicProfileState({ visible: true, approved: true }).canView, false);
});

test('dashboard empty states are specific and actionable', () => {
  for (const state of Object.values(DASHBOARD_EMPTY_STATES)) {
    assert.ok(state.title.length > 12);
    assert.ok(state.body.length > 30);
    assert.ok(!['no data', 'nothing here', 'empty state'].includes(state.title.toLowerCase()));
  }
  assert.equal(DASHBOARD_EMPTY_STATES.projects.href, '/dashboard/projects/new');
  assert.equal(DASHBOARD_EMPTY_STATES.casting.href, '/casting-calls');
});
