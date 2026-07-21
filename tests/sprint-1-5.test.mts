import assert from 'node:assert/strict';
import test from 'node:test';
import { castingApplicationIssue } from '../src/lib/castingEligibility.ts';
import { normalizeNotification } from '../src/lib/notifications.ts';
import { safeLocalRedirect } from '../src/lib/safeRedirect.ts';
import {
  isStaleSubscriptionEvent,
  subscriptionProfileId,
} from '../src/lib/stripeSubscription.ts';
import { inspectBillingConfig } from '../src/lib/billingConfig.ts';
import {
  grantsPaidAccess,
  internalPlanForPrice,
  isOlderStripeEvent,
} from '../src/lib/billingSubscription.ts';
import {
  parsePublicSupabaseConfig,
} from '../src/lib/environment.ts';
import { inspectEmailConfig } from '../src/lib/emailConfig.ts';

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

test('billing configuration distinguishes disabled, broken, and enabled states', () => {
  assert.equal(inspectBillingConfig({}).status, 'disabled');
  const broken = inspectBillingConfig({ STRIPE_SECRET_KEY: 'bad' });
  assert.equal(broken.status, 'broken');
  if (broken.status === 'broken') {
    assert.ok(broken.issues.includes('STRIPE_WEBHOOK_SECRET is missing'));
    assert.ok(broken.issues.includes('STRIPE_SECRET_KEY has an invalid format'));
  }

  const enabled = inspectBillingConfig({
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_ID_MONTHLY: 'price_monthly',
    STRIPE_PRICE_ID_ANNUAL: 'price_annual',
    NEXT_PUBLIC_SITE_URL: 'https://staging.magiora.example',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-example',
    VERCEL_ENV: 'preview',
  });
  assert.equal(enabled.status, 'enabled');

  const productionWithTestKey = inspectBillingConfig({
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_ID_MONTHLY: 'price_monthly',
    STRIPE_PRICE_ID_ANNUAL: 'price_annual',
    NEXT_PUBLIC_SITE_URL: 'https://magiora.example',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-example',
    VERCEL_ENV: 'production',
  });
  assert.equal(productionWithTestKey.status, 'broken');
  if (productionWithTestKey.status === 'broken') {
    assert.ok(productionWithTestKey.issues.includes('Stripe test keys are not allowed in production'));
  }
});

test('billing access and ordering use authoritative subscription state', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(grantsPaidAccess('active', future), true);
  assert.equal(grantsPaidAccess('trialing', future), true);
  assert.equal(grantsPaidAccess('past_due', future), false);
  assert.equal(grantsPaidAccess('active', past), false);
  assert.equal(
    isOlderStripeEvent('2026-07-20T12:00:00.000Z', Date.parse('2026-07-20T11:00:00.000Z') / 1000),
    true
  );
  assert.equal(internalPlanForPrice('price_m', 'price_m', 'price_a'), 'member_monthly');
  assert.equal(internalPlanForPrice('price_unknown', 'price_m', 'price_a'), null);
});

test('public Supabase configuration fails clearly and permits local development', () => {
  assert.throws(
    () => parsePublicSupabaseConfig(undefined, undefined),
    /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/
  );
  assert.throws(
    () => parsePublicSupabaseConfig('http://remote.example', 'anon-key'),
    /HTTPS or localhost/
  );
  assert.deepEqual(parsePublicSupabaseConfig('http://localhost:54321', 'anon-key'), {
    url: 'http://localhost:54321',
    anonKey: 'anon-key',
  });
});

test('email configuration distinguishes disabled, invalid, and staging-ready states', () => {
  assert.equal(inspectEmailConfig(undefined, undefined, undefined).status, 'disabled');
  assert.equal(inspectEmailConfig('bad', 'bad', 'not-a-url').status, 'broken');
  assert.equal(
    inspectEmailConfig(
      're_staging_example',
      'Magiora Staging <staging@example.com>',
      'https://staging.magiora.example'
    ).status,
    'enabled'
  );
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
