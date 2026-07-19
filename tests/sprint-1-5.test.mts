import assert from 'node:assert/strict';
import test from 'node:test';
import { castingApplicationIssue } from '../src/lib/castingEligibility.ts';
import { normalizeNotification } from '../src/lib/notifications.ts';
import { safeLocalRedirect } from '../src/lib/safeRedirect.ts';
import {
  isStaleSubscriptionEvent,
  subscriptionProfileId,
} from '../src/lib/stripeSubscription.ts';

test('safeLocalRedirect accepts local paths and rejects redirect bypasses', () => {
  assert.equal(safeLocalRedirect('/dashboard?tab=profile', '/'), '/dashboard?tab=profile');
  for (const unsafe of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/dashboard\u0000.example.com',
    decodeURIComponent('%2F%2Fevil.example'),
    decodeURIComponent('%5C%5Cevil.example'),
  ]) {
    assert.equal(safeLocalRedirect(unsafe, '/fallback'), '/fallback');
  }
});

test('normalizeNotification produces one stable client shape', () => {
  assert.deepEqual(
    normalizeNotification({
      id: 'notification-1',
      type: 'casting_call_match',
      payload: { body: 'Lead role', call_id: 'call-1' },
      read_at: null,
      created_at: '2026-07-19T12:00:00.000Z',
    }),
    {
      id: 'notification-1',
      type: 'casting_call_match',
      title: 'New casting call match',
      body: 'Lead role',
      related_id: 'call-1',
      read_at: null,
      created_at: '2026-07-19T12:00:00.000Z',
    }
  );
});

test('Stripe metadata and stale-event ordering prefer the current subscription', () => {
  assert.equal(subscriptionProfileId('profile-checkout', 'profile-sub'), 'profile-checkout');
  assert.equal(subscriptionProfileId(undefined, 'profile-sub'), 'profile-sub');
  assert.equal(subscriptionProfileId(undefined, undefined), null);
  assert.equal(isStaleSubscriptionEvent('sub_current', 'sub_old'), true);
  assert.equal(isStaleSubscriptionEvent('sub_current', 'sub_current'), false);
  assert.equal(isStaleSubscriptionEvent(null, 'sub_first'), false);
});

test('casting eligibility rejects non-members, owners, closed and duplicate applications', () => {
  const base = {
    isMember: true,
    status: 'open',
    isOwner: false,
    applicationDeadline: '2026-07-20',
    alreadyApplied: false,
    now: Date.parse('2026-07-19T12:00:00Z'),
  };
  assert.equal(castingApplicationIssue(base), null);
  assert.match(castingApplicationIssue({ ...base, isMember: false })!, /Member/);
  assert.match(castingApplicationIssue({ ...base, status: 'draft' })!, /not open/);
  assert.match(castingApplicationIssue({ ...base, isOwner: true })!, /own/);
  assert.match(
    castingApplicationIssue({ ...base, applicationDeadline: '2026-07-18' })!,
    /passed/
  );
  assert.match(
    castingApplicationIssue({ ...base, alreadyApplied: true })!,
    /already applied/
  );
});
