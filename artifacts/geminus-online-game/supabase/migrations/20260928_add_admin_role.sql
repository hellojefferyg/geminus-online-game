-- Applied to the live project on 2026-09-28: adds the Admin role (Dev > Admin > Arch > Mod > Player).
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check (role in ('dev', 'admin', 'arch', 'mod'));

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
  elsif new_role in ('dev', 'admin', 'arch', 'mod') then
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
revoke execute on function public.set_user_role(text, text) from public, anon;
grant execute on function public.set_user_role(text, text) to authenticated;
