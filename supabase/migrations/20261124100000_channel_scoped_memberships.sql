-- Keep one admin directory while separating web and desktop identities.
-- Legacy users remain registration_channel='unknown'; no existing account is reclassified.
-- Username and phone uniqueness remain global for compatibility with desktop username login
-- and existing phone collisions. Email identity becomes channel-scoped.
begin;
drop index if exists public.users_email_key;
create unique index users_registration_channel_email_key
  on public.users (registration_channel, lower(email));
drop index if exists public.registration_verifications_email_unique_idx;
create unique index registration_verifications_channel_email_key
  on public.registration_verifications (registration_channel, lower(email));
commit;
