-- Applied to the live project on 2026-09-28: staff can delete chat messages; 1 message/second per player.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where uid = (auth.uid())::text and role in ('dev', 'admin', 'arch', 'mod'));
$$;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

drop policy if exists chat_delete_staff on public.chat_messages;
create policy chat_delete_staff on public.chat_messages for delete to authenticated using (public.is_staff());
grant delete on public.chat_messages to authenticated;

create or replace function public.chat_messages_set_sender()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.sender_uid := (auth.uid())::text;
  -- Anti-spam: one message per second per player
  if exists (select 1 from public.chat_messages m
             where m.sender_uid = new.sender_uid and m.created_at > now() - interval '1 second') then
    raise exception 'Slow down: one message per second' using errcode = 'P0001';
  end if;
  new.sender_name := coalesce(
    (select nullif(btrim(p.name), '') from public.players p where p.uid = (auth.uid())::text),
    'Pilot'
  );
  new.sender_role := (select r.role from public.user_roles r where r.uid = (auth.uid())::text);
  new.created_at := now();
  return new;
end;
$$;

create index if not exists chat_messages_sender_created_idx on public.chat_messages (sender_uid, created_at desc);
