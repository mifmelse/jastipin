-- Moments become social-style posts: a post has text + location + many media.
-- Idempotent (parts were hotfix-applied out of band).
alter table trip_moments drop column if exists media_url;
alter table trip_moments drop column if exists caption;
alter table trip_moments add column if not exists body text;
alter table trip_moments add column if not exists location text;
alter table trip_moments add column if not exists created_by uuid references profiles (id) on delete set null;

create table if not exists trip_moment_media (
  id         uuid primary key default gen_random_uuid(),
  moment_id  uuid not null references trip_moments (id) on delete cascade,
  url        text not null,
  type       text not null default 'image' check (type in ('image', 'video')),
  sort_order int not null default 0
);
create index if not exists trip_moment_media_moment_id_idx on trip_moment_media (moment_id);

alter table trip_moment_media enable row level security;
drop policy if exists "authenticated full access" on trip_moment_media;
create policy "authenticated full access" on trip_moment_media
  for all to authenticated using (true) with check (true);
