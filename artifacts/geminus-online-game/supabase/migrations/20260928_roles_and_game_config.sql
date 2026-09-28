-- Applied to the live project on 2026-09-28
-- Roles (Dev > Arch > Mod > Player), live game balance config, role tags in chat.

-- ─── Roles ────────────────────────────────────────────────────────
create table if not exists public.user_roles (
  uid text primary key,
  role text not null check (role in ('dev', 'arch', 'mod')),
  granted_by text,
  granted_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

drop policy if exists user_roles_read on public.user_roles;
create policy user_roles_read on public.user_roles for select to authenticated using (true);
-- No insert/update/delete policies: changes go through set_user_role() below.
revoke all on public.user_roles from anon;
grant select on public.user_roles to authenticated;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.user_roles where uid = (auth.uid())::text), 'player');
$$;

create or replace function public.is_dev()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where uid = (auth.uid())::text and role = 'dev');
$$;

-- Devs grant or remove roles. new_role null/'player' removes the role.
create or replace function public.set_user_role(target_uid text, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_dev() then
    raise exception 'Only devs can change roles';
  end if;
  if new_role is null or new_role = 'player' then
    if target_uid = (auth.uid())::text
       and (select count(*) from public.user_roles where role = 'dev') <= 1 then
      raise exception 'You are the last dev; add another dev first';
    end if;
    delete from public.user_roles where uid = target_uid;
  elsif new_role in ('dev', 'arch', 'mod') then
    if target_uid = (auth.uid())::text and new_role <> 'dev'
       and (select count(*) from public.user_roles where role = 'dev') <= 1 then
      raise exception 'You are the last dev; add another dev first';
    end if;
    insert into public.user_roles (uid, role, granted_by) values (target_uid, new_role, (auth.uid())::text)
    on conflict (uid) do update set role = excluded.role, granted_by = excluded.granted_by, granted_at = now();
  else
    raise exception 'Unknown role %', new_role;
  end if;
end;
$$;

revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_dev() from public, anon;
revoke execute on function public.set_user_role(text, text) from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_dev() to authenticated;
grant execute on function public.set_user_role(text, text) to authenticated;

-- Devs can see every player (for the Roles screen)
drop policy if exists players_select_dev on public.players;
create policy players_select_dev on public.players for select to authenticated using (public.is_dev());

-- ─── Live game balance ────────────────────────────────────────────
create table if not exists public.game_config (
  key text primary key,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  version integer not null default 1,
  updated_by text,
  updated_at timestamptz not null default now()
);
create table if not exists public.game_config_history (
  id bigint generated always as identity primary key,
  key text not null,
  data jsonb not null,
  version integer not null,
  updated_by text,
  updated_at timestamptz not null,
  note text
);
alter table public.game_config enable row level security;
alter table public.game_config_history enable row level security;

drop policy if exists game_config_read on public.game_config;
create policy game_config_read on public.game_config for select to authenticated using (true);
drop policy if exists game_config_dev_insert on public.game_config;
create policy game_config_dev_insert on public.game_config for insert to authenticated with check (public.is_dev());
drop policy if exists game_config_dev_update on public.game_config;
create policy game_config_dev_update on public.game_config for update to authenticated using (public.is_dev()) with check (public.is_dev());
drop policy if exists game_config_history_dev_read on public.game_config_history;
create policy game_config_history_dev_read on public.game_config_history for select to authenticated using (public.is_dev());

revoke all on public.game_config from anon;
revoke all on public.game_config_history from anon;
grant select, insert, update on public.game_config to authenticated;
grant select on public.game_config_history to authenticated;

-- Stamp who/when/version server-side and keep every published version.
create or replace function public.game_config_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_by := (auth.uid())::text;
  new.updated_at := now();
  new.version := case when tg_op = 'UPDATE' then old.version + 1 else 1 end;
  insert into public.game_config_history (key, data, version, updated_by, updated_at)
  values (new.key, new.data, new.version, new.updated_by, new.updated_at);
  return new;
end;
$$;
drop trigger if exists game_config_stamp on public.game_config;
create trigger game_config_stamp before insert or update on public.game_config
  for each row execute function public.game_config_stamp();
revoke execute on function public.game_config_stamp() from public, anon, authenticated;

-- ─── Role tags in chat ────────────────────────────────────────────
alter table public.chat_messages add column if not exists sender_role text;

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
  new.sender_role := (select r.role from public.user_roles r where r.uid = (auth.uid())::text);
  new.created_at := now();
  return new;
end;
$$;

-- ─── Starting devs: Jeff and Syn ──────────────────────────────────
insert into public.user_roles (uid, role, granted_by)
select u.id::text, 'dev', 'setup' from auth.users u
where lower(u.email) in ('imjuug@icloud.com', 'synesence7600@gmail.com')
on conflict (uid) do nothing;
