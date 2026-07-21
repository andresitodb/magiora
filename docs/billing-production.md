# Magiora billing operations

## Architecture

```text
Pricing
  -> authenticated server action
  -> Stripe Checkout (monthly or annual server-owned Price ID)
  -> signed webhook
  -> stripe_webhook_events claim
  -> sync_stripe_subscription RPC
  -> subscriptions row + derived profiles.plan
  -> server-side membership gates
```

The Checkout success redirect is presentation only. It returns to
`/dashboard?checkout=pending`; access changes only after a signed subscription
event is synchronized.

## Environment

Billing is disabled when none of the Stripe variables are present. A partial
configuration is treated as broken and billing actions fail without affecting
unrelated public pages.

Required in production:

- `STRIPE_SECRET_KEY` (`sk_live_...` only in production)
- `STRIPE_WEBHOOK_SECRET` (`whsec_...`)
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_ANNUAL`
- `NEXT_PUBLIC_SITE_URL` (absolute HTTPS URL)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Preview and local environments must use Stripe test-mode keys and separate
test Price IDs. Never copy live secrets into preview deployments.

## Stripe configuration

Create one product with monthly and annual recurring prices. Configure Billing
Portal to allow payment-method changes, invoice/subscription inspection and
cancellation according to the chosen cancellation policy.

Register this webhook endpoint:

```text
https://<production-domain>/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Subscription objects are authoritative for local access and subscription
fields. Invoice events are recorded for operations but do not independently
change access; Stripe emits the corresponding subscription update when its
status changes.

## Access policy

Only `active` and `trialing` grant paid access, and the stored period end must
not be expired. `past_due`, `unpaid`, `canceled`, `incomplete`,
`incomplete_expired`, and `paused` do not grant access. Cancellation scheduled
for period end retains access while Stripe continues reporting an eligible
status and a future period end.

## Event ledger and retries

Apply `202607210001_billing_event_ledger.sql` before enabling the webhook. The
ledger stores identifiers and processing metadata, not full Stripe payloads.
Completed event IDs return a successful duplicate acknowledgement. Failed
events may retry. A processing claim becomes reclaimable after five minutes.
The subscription synchronization RPC applies an event only when its Stripe
timestamp is at least as new as the stored timestamp.

To inspect failures:

```sql
select event_id, event_type, processing_status, attempt_count,
       last_attempted_at, error_summary
from public.stripe_webhook_events
where processing_status <> 'processed'
order by last_attempted_at desc;
```

Use Stripe Dashboard's **Resend** action for a failed event after correcting
the underlying issue. Do not edit an event ID or mark it processed manually.

## Local test mode

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Checkout completion should be tested through an actual test Checkout Session
because a generic trigger does not contain Magiora's profile metadata.

Validate monthly, annual, duplicate checkout, Portal, scheduled cancellation,
renewal, payment failure/recovery, duplicate delivery, delayed/out-of-order
delivery, unknown metadata and invalid signatures.

## Activation

1. Back up the Supabase database.
2. Review and apply the billing migration in staging.
3. Run Stripe test-mode matrix with two Magiora users.
4. Confirm Portal settings and return URL.
5. Confirm no live key exists in preview/local environments.
6. Apply the migration to production.
7. Configure production variables and webhook endpoint.
8. Perform one controlled live subscription and cancellation.
9. Monitor webhook failures and the event ledger.

## Disable and rollback

To stop new purchases, remove all four Stripe variables together or disable
the Checkout controls at deployment level. Keep the webhook configured while
active subscriptions exist so cancellation and payment-state changes continue
to synchronize.

Application rollback is a normal previous-deployment rollback. Do not drop the
ledger or new subscription columns during an incident; they are backward
compatible and contain operational history. Database rollback requires the
pre-migration backup and owner-level Supabase access.
