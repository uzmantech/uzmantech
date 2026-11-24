-- Keep one admin directory while separating web and desktop identities.
-- Legacy users remain registration_channel='unknown'; no existing account is reclassified.
-- Username remains globally unique for compatibility with username-based sign-in.
-- Email and phone can be reused across web/desktop channels, but not within a channel.
begin;
alter table public.users drop constraint if exists users_email_key;
create unique index users_registration_channel_email_key
  on public.users (registration_channel, email);
drop index if exists public.users_phone_unique_nonempty_idx;
create unique index users_registration_channel_phone_key
  on public.users (registration_channel, phone)
  where phone is not null and btrim(phone) <> '';
drop index if exists public.registration_verifications_email_unique_idx;
create unique index registration_verifications_channel_email_key
  on public.registration_verifications (registration_channel, email);
commit;
