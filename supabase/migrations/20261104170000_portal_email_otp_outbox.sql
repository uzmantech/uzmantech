create table if not exists public.portal_email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null check (length(recipient) between 3 and 254),
  subject text not null check (length(subject) between 1 and 180),
  body text not null check (length(body) between 1 and 12000),
  status text not null default 'queued' check (status in ('queued','sending','sent','failed')),
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 10),
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  expires_at timestamptz not null default (now() + interval '20 minutes')
);
create index if not exists portal_email_outbox_queue_idx
  on public.portal_email_outbox (status, created_at);
create index if not exists portal_email_outbox_expiry_idx
  on public.portal_email_outbox (expires_at);
alter table public.portal_email_outbox enable row level security;
revoke all on public.portal_email_outbox from anon, authenticated;
grant all on public.portal_email_outbox to service_role;
alter table public.users add column if not exists reset_code_sent_at timestamptz;
