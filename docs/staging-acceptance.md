# Staging acceptance plan

Status vocabulary: **implemented** means code exists; **static** means code/docs were inspected; **local** means executed without external services; **staging** and **production** require evidence from those environments. Never promote a result between levels.

## Isolated architecture

Use a dedicated staging Vercel project/environment, staging Supabase project and Storage, Stripe test-mode product/endpoints, Resend staging domain/audience, and an HTTPS staging URL. Never use production database, buckets, service-role key, live Stripe keys/webhook, real billing records, or real recipients without explicit approval.

Sprint 5.7 is present in commit `48d0c04`: centralized/disable-safe configuration; authenticated, confirmed-email checkout; server-owned prices; customer reuse; duplicate protection; Portal; pending UI; signed/idempotent/retryable/order-safe webhook; authoritative synchronization and paid server gates. Supabase CLI installation, `supabase/config.toml`, and `supabase/.gitignore` predated its implementation.

## Test record template

For every row record: test ID, date, commit, staging project/host, actor, preconditions, steps, expected and actual Stripe/DB/UI/access states, cleanup, evidence, result, defect. Never store secrets or complete payment, identity-document, cookie, token, or email payloads.

## Billing acceptance matrix

| Case / precondition / actor | Steps | Expected Stripe state | Expected database state | Expected UI and access | Cleanup |
|---|---|---|---|---|---|
| Disabled; all Stripe vars absent; operator + free A | Deploy, open public pages, submit monthly | No session/customer/subscription | No billing mutation | Public works; Checkout unavailable; paid actions denied | Restore test vars |
| Incomplete config; only test secret present; operator | Deploy and open public then Pricing | No mutation | No mutation; configuration error logged | Public works; Billing fails safely | Remove partial var |
| Unconfirmed free A | Sign in and submit monthly | No Checkout Session | No subscription/plan change | Confirmation message; denied | Confirm or delete user |
| Monthly; confirmed free A | Complete Checkout with approved test card | Active monthly Subscription/customer | One row with monthly price, active status, future end; profile member after webhook | Pending before webhook; active afterward | Cancel subscription |
| Annual; confirmed free B | Complete annual Checkout | Active annual Subscription | Annual price/plan and period stored | Same activation behavior | Cancel subscription |
| Checkout cancellation; free A | Enter Checkout then cancel | Open/expired Session; no active Subscription | No qualifying subscription | Return to Pricing; paid access denied | Expire Session |
| Pending webhook; free A; delivery temporarily disabled | Complete Checkout, visit success URL | Active Subscription, webhook undelivered | No qualifying local state yet | “Being confirmed”; paid actions denied | Restore endpoint and resend |
| Duplicate attempt; free A then active A | Double-submit; submit again after activation | No unintended second active Subscription; active attempt routes to Portal | One profile subscription/customer mapping | No duplicate access; Portal for active user | Cancel extras only if defect |
| Portal; paid A and paid B | Open Portal from each session | Each session scoped to its customer | No ownership mutation | Each sees only own billing account | Close sessions |
| Period-end cancellation; paid A | Schedule cancellation in Portal | `cancel_at_period_end=true`, active until end | Cancellation fields stored, status eligible until end | Access retained until period end, then revoked | Restore fixture |
| Immediate cancellation; enabled in staging | Cancel immediately | Deleted/canceled Subscription | Nonqualifying status, profile listed | Paid actions denied | Recreate fixture |
| Renewal; paid A on test clock | Advance clock and pay renewal | New paid invoice and future period | Period end advances; active remains | Uninterrupted access | Delete clock fixture |
| Failed payment; paid A | Use failing method and advance renewal | Failed invoice; authoritative Subscription becomes nonqualifying per Stripe policy | Status/event synchronized | Access follows status matrix; no invoice-only grant | Restore method |
| Recovered payment; failed A | Pay/retry successfully | Paid invoice and active Subscription | Active/future period synchronized | Access restored only after subscription event | Restore fixture |
| Duplicate webhook; processed event exists | Resend identical event ID | Same event delivered again | One ledger row; no second state mutation | HTTP 200 duplicate; unchanged access | None |
| Failed retry; safe deliberate metadata mismatch | Deliver, observe failure, repair fixture, resend same ID | Stripe delivery retries | Ledger failed then processed; attempt increments | 500 before repair, success after; no premature access | Remove fixture |
| Delayed event | Hold an event, deliver after later unrelated processing | Both deliveries visible | Correct object state after delayed event | Access matches authoritative latest state | None |
| Out-of-order same subscription | Deliver newer update then older update | Both events delivered | `latest_stripe_event_created_at` and subscription remain newer | No regression in access/UI | None |
| Invalid signature; operator | POST altered/unsigned body | No accepted Stripe event | No ledger/subscription mutation | HTTP 400; no access change | None |
| Unknown customer; signed test event | Deliver subscription with no local mapping/metadata | Test Subscription exists | Failed ledger attempt; no user mutation | HTTP 500; nobody gains access | Delete Stripe fixture |
| Unknown user metadata | Deliver with nonexistent UUID/profile | Test Subscription exists | FK/RPC fails; no profile mutation | Failure visible operationally; no access | Delete fixture |
| Subscription deletion; paid A | Delete in Stripe test mode | Deleted Subscription event | Nonqualifying local status; profile listed | Paid controls/actions denied | Recreate if needed |
| Expired membership; fixture end in past | Read UI and submit every paid action | No current qualifying Subscription | Expired period retained for history | Pricing offers Checkout; all paid actions denied | Restore fixture |

For every activation check profile controls, casting creation/application, event creation, Spotlight request, Pricing/Portal, and direct server-action submission.

## Staging identities and authorization

Create anonymous, free A, free B, paid monthly, paid annual, canceled-active-until-end, expired, and administrator identities. Use unique synthetic email addresses and user-owned data.

| Feature | Free/expired | Paid/current | Cross-user | Administrator |
|---|---|---|---|---|
| Profile premium controls | Hidden/disabled and server rejects | Visible and server accepts | Cannot mutate another profile | No implicit paid bypass unless explicitly implemented |
| Casting create/apply | Server rejects paid-only action | Accepts valid action | Cannot close/review another owner's call | Moderation only through protected admin flow |
| Event create | Server rejects | Accepts | Cannot edit another owner's event | Protected moderation flow only |
| Spotlight request | Server rejects | Accepts once per rules | Cannot request/edit for another user | Editorial flow through admin authorization |
| Billing Portal | No customer: safe error | Opens own customer only | Never accepts client-selected customer/profile | No impersonation behavior assumed |

UI visibility is not evidence of authorization. Submit direct requests/actions as the wrong user and verify database state is unchanged.

## Auth acceptance matrix

| Case | Objective expected result |
|---|---|
| Signup | User created in staging; safe redirect; no open redirect |
| Email confirmation | PKCE callback exchanges code and creates refreshed session |
| Unconfirmed login/Billing | Product login follows configured Auth policy; Billing rejects unconfirmed email |
| Login/session refresh/logout | Session cookies rotate, protected pages remain available after refresh, logout denies dashboard |
| Password recovery | Supabase email opens callback, exchanges PKCE code, reset succeeds, old password fails |
| Expired recovery/invalid callback | Safe login error; no session/password change |
| Anonymous dashboard/admin | Redirect/deny without protected content |
| Non-admin admin | Denied server-side |
| Post-login `next` | Local path accepted; absolute/protocol-relative/backslash payload rejected |

## Email readiness and tests

Supabase owns signup confirmation and recovery email. Application status and casting matches use Resend. There are no Billing webhook emails. With Resend disabled, attempts are logged as skipped. Sender/key/URL are validated, sends are awaited, and `dedupe_key` is persisted. Email occurs after the primary mutation, so delivery failure must not roll it back.

Test valid staging sender delivery, disabled service, invalid sender, provider failure, repeated same template/related ID/recipient, application status, casting match, signup confirmation, recovery, and suppression of real recipients. Confirm one `email_log` outcome per dedupe key and inspect logs without recipient addresses or provider bodies.

## Public browser acceptance

Test Home, Directory, profile, Projects/project, Spotlight/interview, Casting Calls/detail, Events/detail, Pricing, Login, Signup, Recovery, and 404 on desktop/mobile. For each verify HTTP status, title/description/canonical, loading/empty/service-failure state, missing images, keyboard focus/navigation, and links. For global search test success, one-category failure, and total failure with distinct UI/log outcomes.

## Dashboard acceptance

Free: onboarding, profile editing, project creation/editing, permitted uploads, logout. Paid: premium profile controls, casting creation/application review, event creation, subscription state and own Portal. Admin/owner: only where explicitly protected. Verify errors and zero-row mutations do not display success.

## Admin acceptance

Verify anonymous denial, non-admin denial, authorized admin access, profile moderation, verification review and signed document access, Featured profiles, Spotlight workflow, supported event/casting moderation, application state changes, failure states, and zero-row detection. Repeat critical mutations by direct request without client controls.

## Observability

| Signal | Location | Investigate when | Owner |
|---|---|---|---|
| App/search/admin/Auth/upload errors | Vercel function/runtime logs; Supabase Auth/API/Storage logs | repeated 5xx, total search failure, denied legitimate operation, zero-row mutation | Application on-call |
| Webhook failure/stale/duplicate | Vercel logs, Stripe delivery log, `stripe_webhook_events` | any failed backlog, retry growth, payment/access mismatch | Billing owner |
| Email failures/skips | Vercel logs, Resend activity, `email_log` | staging configured but skipped/failed, duplicate delivery | Messaging owner |

Never log secrets, Authorization headers, cookies, reset codes, full webhook/email bodies, identity documents, service-role keys, payment data, or unnecessary personal data. Use event/record IDs and redacted categories. Set Vercel/Supabase/Stripe/Resend retention according to the selected plans and document the actual values before launch.

## Acceptance gates

- All critical matrices executed in staging with evidence; no unresolved P0/P1.
- Billing migration and preflight pass in staging; duplicate/retry/stale tests pass.
- Real confirmation and PKCE recovery email pass.
- Two-user RLS and every Storage isolation case pass.
- Admin server authorization and zero-row behavior pass.
- Backup/restore and rollback owners are recorded.
- Production variables receive two-person review where possible.

Rollback/stop immediately for cross-user exposure, Auth outage, failed/partial migration, payment without access, access without qualifying payment, subscription mismatch, or growing webhook backlog.
