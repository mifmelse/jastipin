-- Structured itinerary (replaces the free-text trips.itinerary column).
create table trip_itineraries (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  date        date,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);
create index trip_itineraries_trip_id_idx on trip_itineraries (trip_id);

alter table trips drop column itinerary;

alter table trip_itineraries enable row level security;
create policy "authenticated full access" on trip_itineraries
  for all to authenticated using (true) with check (true);
