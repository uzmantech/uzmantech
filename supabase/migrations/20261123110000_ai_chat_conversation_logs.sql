create table if not exists public.ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null,
  question text not null check (char_length(question) between 1 and 4000),
  answer text not null check (char_length(answer) between 1 and 12000),
  sources jsonb not null default '[]'::jsonb,
  model text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ai_chat_logs_created_idx on public.ai_chat_logs(created_at desc);
create index if not exists ai_chat_logs_user_created_idx on public.ai_chat_logs(user_id, created_at desc);
alter table public.ai_chat_logs enable row level security;
revoke all on public.ai_chat_logs from anon, authenticated;
grant all on public.ai_chat_logs to service_role;
