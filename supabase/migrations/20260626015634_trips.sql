-- Trip Management: the container for all jastip activity.
-- trips + legs (trip_routes) + bookings + expenses + moments.

create table trips (
  id                uuid primary key default gen_random_uuid(),
  code              text unique,                       -- TRP-xxxx (auto)
  name              text not null,
  type              text not null check (type in ('single', 'round', 'multi')),
  traveler_count    int not null default 1,
  total_capacity_kg numeric,                            -- agregat acuan; riil dari luggages nanti
  status            text not null default 'draft'
                      check (status in ('draft', 'planned', 'ongoing', 'completed', 'cancelled')),
  itinerary         text,                               -- MVP: free text
  created_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create sequence trips_code_seq;
create trigger trips_set_code
  before insert on trips
  for each row execute function set_code('TRP', 'trips_code_seq');
create trigger trips_set_updated_at
  before update on trips
  for each row execute function set_updated_at();

-- A leg: A → B with a departure date. Order/Load Planning/Delivery attach to legs.
create table trip_routes (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references trips (id) on delete cascade,
  from_country_id uuid not null references countries (id) on delete restrict,
  to_country_id   uuid not null references countries (id) on delete restrict,
  departure_date  date,
  sequence        int not null default 1
);
create index trip_routes_trip_id_idx on trip_routes (trip_id);

create table trip_bookings (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references trips (id) on delete cascade,
  type         text not null check (type in ('flight', 'hotel', 'transport', 'other')),
  title        text not null,
  reference_no text,
  date         date,
  amount       numeric,
  currency     text not null default 'IDR',
  notes        text
);
create index trip_bookings_trip_id_idx on trip_bookings (trip_id);

create table trip_expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  category    text not null,
  description text,
  amount      numeric not null,
  currency    text not null default 'IDR',
  spent_at    date,
  receipt_url text,
  created_by  uuid references profiles (id) on delete set null
);
create index trip_expenses_trip_id_idx on trip_expenses (trip_id);

create table trip_moments (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  caption    text,
  media_url  text not null,
  created_at timestamptz not null default now()
);
create index trip_moments_trip_id_idx on trip_moments (trip_id);

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table trips         enable row level security;
alter table trip_routes   enable row level security;
alter table trip_bookings enable row level security;
alter table trip_expenses enable row level security;
alter table trip_moments  enable row level security;

create policy "authenticated full access" on trips
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on trip_routes
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on trip_bookings
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on trip_expenses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on trip_moments
  for all to authenticated using (true) with check (true);
