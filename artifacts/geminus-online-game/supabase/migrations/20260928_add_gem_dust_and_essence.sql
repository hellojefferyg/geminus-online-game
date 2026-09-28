-- Applied to the live project on 2026-09-28 (Soulforge + gem salvage currencies)
alter table public.players
  add column if not exists gem_dust numeric not null default 0 check (gem_dust >= 0),
  add column if not exists essence numeric not null default 0 check (essence >= 0);
