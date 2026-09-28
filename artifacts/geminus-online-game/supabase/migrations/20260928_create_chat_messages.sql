-- Applied to the live project on 2026-09-28 (live Main/Sales chat)
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  channel text not null check (channel in ('main', 'sales')),
  sender_uid text not null default (auth.uid())::text,
  sender_name text not null default 'Pilot',
  color text not null default '#3EE0FF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on public.chat_messages (channel, created_at desc);

-- The displayed name always comes from the sender's own players row (no impersonation).
create or replace function public.chat_messages_set_sender()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.sender_uid := (auth.uid())::text;
  new.sender_name := coalesce(
    (select nullif(btrim(p.name), '') from public.players p where p.uid = (auth.uid())::text),
    'Pilot'
  );
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists chat_messages_set_sender on public.chat_messages;
create trigger chat_messages_set_sender
  before insert on public.chat_messages
  for each row execute function public.chat_messages_set_sender();

alter table public.chat_messages enable row level security;

drop policy if exists chat_read on public.chat_messages;
create policy chat_read on public.chat_messages
  for select to authenticated using (true);

drop policy if exists chat_insert_own on public.chat_messages;
create policy chat_insert_own on public.chat_messages
  for insert to authenticated with check (sender_uid = (auth.uid())::text);

revoke all on public.chat_messages from anon;
grant select, insert on public.chat_messages to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
