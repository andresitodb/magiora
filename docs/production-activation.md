# Production activation and rollback

Do not execute this runbook until owner access and staging acceptance are complete.

## Activation order

1. Freeze application and migration changes; record commit and artifact.
2. Verify a current production backup and named restore owner.
3. Review production variables against `environment-matrix.md` with two people where possible.
4. Run the read-only billing preflight queries and resolve every unexpected row.
5. Apply the reviewed billing migration as production owner.
6. Verify constraints, indexes, ledger RLS/grants, and RPC grants.
7. Create/review Stripe live monthly and annual Prices; do not reuse test IDs.
8. Configure live Billing Portal actions and cancellation policy.
9. Register the live production webhook and only the documented events.
10. Deploy the tested application artifact.
11. Execute one controlled live payment with an approved account.
12. Confirm signed delivery, processed ledger row, subscription row, and derived profile plan.
13. Confirm paid server actions, own Billing Portal, and no cross-user access.
14. Test approved cancellation path and verify authoritative state.
15. Monitor Vercel, Stripe deliveries, ledger, Supabase, and Resend.
16. Record go/no-go decision and evidence.

## Rollback checklist

- [ ] Disable new Checkout entry by removing all Stripe variables together or deploying the prior application.
- [ ] Keep webhook processing available while existing subscriptions remain, unless it is the incident source.
- [ ] Roll back application to the known artifact.
- [ ] Do not drop ledger/history columns during an incident.
- [ ] Restore database backup only for failed/partial migration or confirmed corruption, under owner control.
- [ ] Reconcile Stripe customers/subscriptions with local rows before reopening Billing.
- [ ] Notify responsible owners and preserve redacted event IDs/timestamps.

Rollback triggers: payment accepted without access, access without qualifying payment, cross-user Portal/data access, Auth outage, failed migration, unrecoverable webhook backlog, or persistent subscription-state divergence.
