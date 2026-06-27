-- B1: who physically travels on a trip (carries goods). Many-to-many trip↔user.
-- Load Planning scopes the luggage-traveler dropdown to this set, and Simulation
-- shows traveler names. role distinguishes the lead from assistants.

create table trip_travelers (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  profile_id  uuid not null references profiles (id) on delete cascade,
  role        text not null default 'assistant' check (role in ('lead', 'assistant')),
  created_at  timestamptz not null default now(),
  unique (trip_id, profile_id)
);
create index trip_travelers_trip_id_idx on trip_travelers (trip_id);

alter table trip_travelers enable row level security;
create policy "authenticated full access" on trip_travelers
  for all to authenticated using (true) with check (true);
