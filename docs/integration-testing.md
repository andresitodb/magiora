# Integration testing

Use test-mode credentials only. Keep all values in `.env.local`; never commit them.

## Required environment variables

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_MONTHLY
STRIPE_PRICE_ID_ANNUAL
```

The monthly and annual Stripe price IDs must be different recurring Price IDs
from the same test-mode account as `STRIPE_SECRET_KEY`.

## Local Stripe webhook

In PowerShell:

```powershell
stripe login
stripe listen --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the temporary `whsec_...` value printed by `stripe listen` into
`STRIPE_WEBHOOK_SECRET`, then restart the Next.js development server.

Verify the configured test prices without creating a charge:

```powershell
stripe prices retrieve $env:STRIPE_PRICE_ID_MONTHLY
stripe prices retrieve $env:STRIPE_PRICE_ID_ANNUAL
```

For a complete local test, open Magiora's pricing page with a test account and
finish Checkout using Stripe's test card `4242 4242 4242 4242`, any future
expiry date, and any CVC. Do not use a real card.

Keep `stripe listen` running and confirm delivery of:

1. `checkout.session.completed`
2. `customer.subscription.updated`
3. `customer.subscription.deleted`

The Checkout Session and Subscription must both contain the same
`metadata.profile_id`.
