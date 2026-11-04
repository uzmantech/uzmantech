create table if not exists public.portal_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 4 and 120),
  category text not null check (category in ('technical','license','payment','archive','other')),
  message text not null check (char_length(btrim(message)) between 20 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id)
);

create index if not exists portal_support_tickets_user_created_idx
  on public.portal_support_tickets(user_id, created_at desc);

create index if not exists portal_support_tickets_status_created_idx
  on public.portal_support_tickets(status, created_at desc);

alter table public.portal_support_tickets enable row level security;
revoke all on public.portal_support_tickets from anon, authenticated;
