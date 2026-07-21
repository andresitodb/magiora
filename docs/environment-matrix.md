# Environment matrix

Never copy values between environments. Preview and staging use isolated Supabase projects, Stripe test mode, and non-production email recipients.

| Variable | Exposure | Required | Format / source | Valid environments | Missing or invalid behavior |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public | All deployed environments | Absolute URL; Vercel deployment URL | Local: HTTP localhost. Preview/staging/production: HTTPS | Metadata falls back locally; Billing and enabled email reject invalid configuration |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | All | Supabase Project URL, HTTPS; localhost allowed locally | Environment-specific | Supabase clients throw a named configuration error |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | All | Supabase publishable/anon key | Must match the environment's URL | Supabase clients throw a named configuration error |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Operations using admin/system access | Supabase project API settings | Separate per environment; never browser-exposed | Public pages that do not use it remain available; service operations fail closed |
| `STRIPE_SECRET_KEY` | Server only | Billing enabled | `sk_test_…` outside production; `sk_live_…` only production | Local/preview/staging test mode; production live mode | All Stripe vars absent disables Billing; partial/invalid configuration fails safely |
| `STRIPE_WEBHOOK_SECRET` | Server only | Billing enabled | `whsec_…`, from that environment's endpoint | Endpoint-specific | Webhook returns 503 for broken configuration; invalid signatures return 400 |
| `STRIPE_PRICE_ID_MONTHLY` | Server only | Billing enabled | Distinct `price_…` recurring monthly Price | Same Stripe mode as secret key | Checkout unavailable; client cannot override it |
| `STRIPE_PRICE_ID_ANNUAL` | Server only | Billing enabled | Distinct `price_…` recurring annual Price | Same Stripe mode as secret key | Checkout unavailable; client cannot override it |
| `RESEND_API_KEY` | Server only | Optional locally; required for staging email acceptance | `re_…`, Resend | Environment-specific | Email is logged as skipped; primary transaction remains committed |
| `EMAIL_FROM` | Server only | Required when Resend enabled | `Name <mailbox@verified-domain>` | Resend-verified staging/production domain | Email configuration is broken and send is skipped |
| `TEST_USER_PASSWORD` | Server/test runner only | Staging acceptance automation only | Strong synthetic password | Local/staging only; never shipped to browser | Manual tests remain possible; application runtime does not use it |

## Environment policy

| Environment | Supabase | Stripe | Resend | Intended data |
|---|---|---|---|---|
| Local | Local or isolated dev project | Test mode or disabled | Disabled or test sender | Disposable synthetic data |
| Preview | Isolated preview/dev project | Test mode only | Test recipients only | Disposable synthetic data |
| Staging | Dedicated staging project | Test mode only | Staging domain/audience | Acceptance fixtures; no production copies with sensitive data |
| Production | Production project | Live mode | Production verified domain | Real users and billing records |

`SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Resend keys, and `TEST_USER_PASSWORD` must never use a `NEXT_PUBLIC_` prefix or appear in logs, screenshots, fixtures, or browser bundles.
