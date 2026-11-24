# Web / Desktop Membership Isolation — Manual Test Plan

> **Safety:** Do not run these tests against the production Supabase project. Use a separate local Supabase stack or a staging project with disposable data. The production migration and Edge Functions have not been applied or deployed.

## Current implementation boundary

- The implementation is on `feature/separate-web-desktop-memberships`.
- Pull request: https://github.com/uzmantech/uzmantech/pull/25 (draft; not merged).
- The GitHub Actions type-check passed for the current implementation. This is not an end-to-end test.
- Existing production users are intentionally left as `registration_channel = 'unknown'`; no channel is inferred.
- Username remains globally unique. The same email/phone can be used across channels, but the usernames must differ.

## 1. Prepare an isolated test environment

1. Use a local Supabase stack or a separately provisioned staging project. Do not point the desktop app or portal at production.
2. Apply the repository migrations to that isolated database, then apply `supabase/migrations/20261124100000_channel_scoped_memberships.sql`.
3. Deploy the branch versions of the Edge Functions to that isolated environment:
   - `register`
   - `login`
   - `password-reset`
   - `portal-api`
   - `rapid-service`
4. Configure only test credentials/secrets and a test email provider. Never copy production service-role keys into logs or share them.
5. Confirm the portal and desktop test clients are configured to use the isolated environment.

## 2. Registration isolation

Use synthetic data only. Example shared email: `membership-test@example.invalid`; shared phone: `+905550001122`.

| Test | Action | Expected result |
|---|---|---|
| WEB-01 | Register a web account with the test email and phone | Account is created with `registration_channel = 'web'`. |
| DESK-01 | Register a desktop account using the same email and phone, but a different username | Account is created with `registration_channel = 'desktop_app'`. |
| WEB-02 | Register another web account using the same web email | Rejected as duplicate within the web channel. |
| DESK-02 | Register another desktop account using the same desktop email | Rejected as duplicate within the desktop channel. |
| USER-01 | Reuse a username already used by the other channel | Rejected; username is globally unique. |
| VERIFY-01 | Start verification for the same email in both channels | Verification records remain channel-scoped and do not overwrite one another. |

Check the resulting rows in the isolated database:

```sql
select id, username, email, phone, registration_channel
from public.users
where email = 'membership-test@example.invalid'
order by registration_channel;
```

Expected: two rows, one `web`, one `desktop_app`, with different usernames.

## 3. Login and password reset isolation

| Test | Action | Expected result |
|---|---|---|
| AUTH-01 | Sign in to the web portal using the web account | Web login succeeds. |
| AUTH-02 | Attempt web login using the desktop-only account | Web login is rejected. |
| AUTH-03 | Attempt desktop login using the desktop account | Desktop login succeeds. |
| AUTH-04 | Attempt desktop login using the web-only account | Desktop login is rejected. |
| RESET-01 | Request web password reset for the shared email | Only the web account's verification/reset flow is affected. |
| RESET-02 | Request desktop password reset for the shared email | Only the desktop account's verification/reset flow is affected. |
| SESSION-01 | Try to use a desktop account's token against web portal session verification | Rejected; admin behavior should remain unchanged. |

Also verify that an `unknown` legacy test account follows the intended compatibility path in both clients. Do not change real legacy accounts during testing.

## 4. Admin panel and trial licensing

| Test | Action | Expected result |
|---|---|---|
| ADMIN-01 | Open the admin user list | A registration-channel column/filter is visible. |
| ADMIN-02 | Filter by Web | Only `web` and intentionally compatible `unknown` records appear according to the UI's filter semantics. |
| ADMIN-03 | Filter by Desktop | Desktop accounts are distinguishable from web accounts. |
| TRIAL-01 | Grant a 7-day trial to a desktop test account | License becomes active with `trial_7` and a 7-day expiry. |
| TRIAL-02 | Grant a trial to a web account | Request is rejected; web accounts must not receive the desktop trial action. |
| TRIAL-03 | Try 0 or 31 days | Request is rejected; accepted range is 1–30 days. |
| TRIAL-04 | Grant another duration (e.g. 14 days) | UI and license metadata show the correct duration. |
| AUDIT-01 | Inspect admin audit log and notifications | Trial grant is recorded against the correct test account. |

## 5. Regression checks

- Existing web registration, approval/payment, login, and password-reset flows still work.
- Desktop registration and login payloads/responses remain compatible with the currently released desktop client.
- Admin accounts retain intended access.
- Analytics does not classify any `trial_*` plan as a paid subscription.
- Trial expiry processing handles `trial_*` plans correctly.
- No duplicate rows are created in verification records.
- A web account cannot access desktop-only identity/session paths and vice versa.

## 6. Evidence to collect

For each test, record pass/fail, timestamp, client build, Edge Function response (with tokens and personal data redacted), and relevant synthetic database rows. Do not paste passwords, access tokens, service-role keys, or real customer data into the report.

## 7. Before release

Do not merge PR #25, apply the migration to production, or deploy Edge Functions until the manual tests pass and the release is explicitly approved. Back up production first and review the migration against the exact production schema before applying it.
