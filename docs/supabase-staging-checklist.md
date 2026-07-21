# Supabase staging checklist

## Manual owner tasks

- [ ] Create a dedicated staging project in a non-production organization/account.
- [ ] Record project reference, region, owner, backup policy, and deletion policy.
- [ ] Configure Site URL and allowed redirects for staging `/auth/callback` and `/reset-password` flows.
- [ ] Decide and document email-confirmation behavior; Billing acceptance requires confirmed and unconfirmed identities.
- [ ] Apply repository migrations in order after backup and preflight review.
- [ ] Inspect RLS policies for every public/authenticated/admin table; do not infer them from application code.
- [ ] Create `headshots`, `gallery`, and `project-media` as public-media buckets only if current product behavior requires public URLs.
- [ ] Create `verification-docs` as private; confirm only authorized admin signed-URL access.
- [ ] Verify per-bucket MIME, size, owner-path, update, delete, and read policies.
- [ ] Place the staging service-role key only in server deployment secrets.
- [ ] Seed synthetic identities listed in the acceptance plan; never import real verification documents.
- [ ] Enable backups and perform one restore rehearsal or document the provider-supported restore procedure.
- [ ] Identify where Auth, Postgres, Storage, and API logs are inspected.

## Repository-controlled tasks

- [ ] Deploy the exact tested commit and migrations.
- [ ] Configure the environment matrix without secret values in source control.
- [ ] Run lint, TypeScript, unit tests, and production build.
- [ ] Execute Auth, RLS, Storage, Billing, public, dashboard, and admin acceptance matrices.
- [ ] Save results with timestamp, tester, environment ID, evidence link, and defect ID.

## Storage matrix

Run each applicable case against `headshots`, `gallery`, `project-media`, and `verification-docs`.

| Case | Expected result |
|---|---|
| Allowed MIME within limit | Owner upload succeeds and referenced record renders |
| Invalid MIME | Client and Storage policy reject |
| Exact allowed size | Succeeds |
| Oversized file | Rejects without database reference |
| Owner replace/delete | Succeeds only inside owner path |
| User B overwrite/delete User A | Denied; original remains unchanged |
| Anonymous upload | Denied |
| Public media anonymous read | Succeeds only for intentionally public buckets |
| Verification document anonymous/user read | Denied |
| Admin signed verification access | Short-lived signed URL works, then expires |
| Duplicate filename | Matches declared `upsert` behavior; never overwrites another owner |

Storage security remains **unverified** until all cases pass with two staging users.
