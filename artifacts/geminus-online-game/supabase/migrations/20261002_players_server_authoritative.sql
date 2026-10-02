-- Applied to the live project on 2026-10-02 (via SQL editor; trigger created without the drop).
-- Rollback: drop trigger players_guard on public.players;
-- Progression is written only by api/player/save.js (service role). Browsers may still:
--   * insert their own row at SignUp (progression forced to defaults)
--   * set race / stats once at RaceSelect (while race is blank)
--   * change name / gender

create or replace function public.players_guard()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.xp := 0; new.gold := 0; new.bank := 0; new.level := 1; new.kills := 0;
    new.gem_dust := 0; new.essence := 0; new.attribute_points := 0;
    new.inventory := '[]'::jsonb; new.equipment := '{}'::jsonb; new.gems := '[]'::jsonb;
    return new;
  end if;

  if new.xp is distinct from old.xp or new.gold is distinct from old.gold or new.bank is distinct from old.bank
     or new.level is distinct from old.level or new.kills is distinct from old.kills
     or new.gem_dust is distinct from old.gem_dust or new.essence is distinct from old.essence
     or new.inventory is distinct from old.inventory or new.equipment is distinct from old.equipment
     or new.gems is distinct from old.gems or new.pos is distinct from old.pos then
    raise exception 'Progression is saved through /api/player/save';
  end if;

  if coalesce(old.race, '') <> '' and (
       new.race is distinct from old.race or new.race_name is distinct from old.race_name
       or new.archetype is distinct from old.archetype or new.cci is distinct from old.cci
       or new.base_stats is distinct from old.base_stats or new.hp is distinct from old.hp
       or new.max_hp is distinct from old.max_hp or new.attribute_points is distinct from old.attribute_points) then
    raise exception 'Race and stats are set once at character creation';
  end if;
  return new;
end;
$$;

drop trigger if exists players_guard on public.players;
create trigger players_guard before insert or update on public.players
  for each row execute function public.players_guard();
