# Billing staging runbook

## Static migration review

Migration: `supabase/migrations/202607210001_billing_event_ledger.sql`.

- Adds nullable Stripe price/event-order columns and a non-null `cancel_at_period_end` default.
- Event IDs are the ledger primary key. Status and object/time indexes support retries and operations.
- Partial unique indexes assume one local row per non-null Stripe customer and subscription ID.
- `subscriptions.profile_id` must already exist, be UUID, reference a real profile, and have a unique constraint compatible with `ON CONFLICT (profile_id)`.
- Existing columns required: `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_start`, `current_period_end`, `cancel_at`, and `canceled_at`.
- `profiles.id` must be UUID and `profiles.plan` must accept `listed` and `member`.
- Ledger RLS is enabled and anon/authenticated grants are revoked. RPC functions are `SECURITY DEFINER`, use an empty search path, fully qualify objects, and grant execution only to `service_role`.
- The migration does not contain destructive DDL. Rollback should normally be application rollback while retaining ledger data. Dropping columns/tables requires backup restoration and owner approval.

This is a static review only. Schema compatibility, existing RLS, duplicates, and execution remain unverified until run against isolated staging.

## Read-only preflight SQL

Run all queries as the staging owner before migration. Repeat on production only during an approved launch window.

```sql
-- Duplicate Stripe customers.
select stripe_customer_id, count(*)
from public.subscriptions
where stripe_customer_id is not null
group by stripe_customer_id having count(*) > 1;

-- Duplicate Stripe subscriptions.
select stripe_subscription_id, count(*)
from public.subscriptions
where stripe_subscription_id is not null
group by stripe_subscription_id having count(*) > 1;

-- Orphan subscriptions.
select s.profile_id, s.stripe_subscription_id
from public.subscriptions s
left join public.profiles p on p.id = s.profile_id
where p.id is null;

-- More than one qualifying subscription per profile.
select profile_id, count(*)
from public.subscriptions
where status in ('active', 'trialing')
group by profile_id having count(*) > 1;

-- Unknown statuses.
select status, count(*)
from public.subscriptions
where status is null or status not in
  ('active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')
group by status;

-- Paid profile without a current qualifying subscription.
select p.id
from public.profiles p
left join public.subscriptions s
  on s.profile_id = p.id
 and s.status in ('active','trialing')
 and (s.current_period_end is null or s.current_period_end > now())
where p.plan = 'member' and s.profile_id is null;

-- Qualifying subscription whose derived profile plan is not synchronized.
select s.profile_id, s.stripe_subscription_id
from public.subscriptions s
join public.profiles p on p.id = s.profile_id
where s.status in ('active','trialing')
  and (s.current_period_end is null or s.current_period_end > now())
  and p.plan is distinct from 'member';

-- Null or malformed Stripe IDs.
select profile_id, stripe_customer_id, stripe_subscription_id
from public.subscriptions
where stripe_customer_id is null
   or stripe_customer_id !~ '^cus_[A-Za-z0-9]+$'
   or stripe_subscription_id is null
   or stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$';
```

Any row returned must be classified and resolved before creating unique indexes. These queries do not modify data.

## Staged migration procedure

1. Select the isolated staging Supabase project and confirm its reference ID is not production.
2. Export/backup staging schema and data; record timestamp and restore owner.
3. Compare the dependencies above with staging using catalog queries.
4. Run every preflight query and attach results to the acceptance record.
5. Review the migration checksum, then apply only to staging.
6. Verify `stripe_webhook_events`, three RPCs, indexes, constraints, grants, and RLS.
7. Deploy the matching application revision with staging-only variables.
8. Smoke-test public, authenticated, and admin pages.
9. Send a signed Stripe test event and confirm one ledger row.
10. Resend the same event; expect one processed ledger row and HTTP 200 duplicate acknowledgement.
11. Force a recoverable failure, correct it, resend, and confirm `attempt_count` increments.
12. Deliver a newer subscription event followed by an older one; confirm the older event does not overwrite state.
13. Record HTTP responses, Stripe event IDs, ledger rows, subscription state, and UI access result.
14. Roll back application deployment if any critical check fails. Restore the database backup if migration execution was partial or schema integrity is uncertain.

## Stripe test-mode setup

1. In Stripe Dashboard, enable **Test mode** and create one Magiora Membership product.
2. Add a USD monthly recurring Price and a USD annual recurring Price. Record their test `price_…` IDs.
3. Configure Billing Portal for payment-method updates, invoice/subscription viewing, and the approved cancellation behavior.
4. Add `https://<staging-host>/api/stripe/webhook` as a test-mode webhook endpoint.
5. Subscribe only to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Store the test secret key, endpoint signing secret, and two test Price IDs in staging server environment variables.
7. Redeploy staging and verify no live key exists in Vercel preview/staging scopes.

## Event mapping

| Event | Authoritative object | Local action | Access change | Duplicate/stale/failure behavior |
|---|---|---|---|---|
| `checkout.session.completed` | Retrieved Subscription | Resolve profile metadata, retrieve subscription, synchronize | According to subscription status | Ledger dedupes; older timestamp cannot overwrite; failure is retryable |
| `customer.subscription.created` | Subscription | Upsert authoritative subscription | Active/trialing grants | Same ledger/order rules |
| `customer.subscription.updated` | Subscription | Update status, period, cancellation and price | May grant or revoke | Same ledger/order rules |
| `customer.subscription.deleted` | Subscription | Persist deleted/canceled state | Revokes | Same ledger/order rules |
| `invoice.paid` | Invoice | Record event only | No direct change | Intentionally ignored for state; subscription event remains authoritative |
| `invoice.payment_failed` | Invoice | Record event only | No direct change | Intentionally ignored for state; subscription event remains authoritative |

Unsupported signed events are recorded and acknowledged without mutation.
