-- Male/female, picked at sign-up with the race; decides which race character walks the Graphics map.
alter table public.players add column if not exists gender text not null default 'male';
alter table public.players drop constraint if exists players_gender_check;
alter table public.players add constraint players_gender_check check (gender in ('male', 'female'));
