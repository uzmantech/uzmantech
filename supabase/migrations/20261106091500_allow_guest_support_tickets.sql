alter table public.portal_support_tickets
  alter column user_id drop not null;

alter table public.portal_support_tickets
  add column if not exists guest_name text,
  add column if not exists guest_email text;

alter table public.portal_support_tickets
  drop constraint if exists portal_support_tickets_user_id_fkey;

alter table public.portal_support_tickets
  add constraint portal_support_tickets_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

create index if not exists portal_support_tickets_guest_email_created_idx
  on public.portal_support_tickets(guest_email, created_at desc)
  where user_id is null;
