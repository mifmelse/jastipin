-- Geography reference tables: continents + countries.
-- Used by customers, customer_addresses, and trip_routes (from/to country).
-- Managed under "Delivery Management" in the admin panel.

create table continents (
  id   uuid primary key default gen_random_uuid(),
  code text not null unique,          -- e.g. 'AS', 'EU'
  name text not null
);

create table countries (
  id           uuid primary key default gen_random_uuid(),
  continent_id uuid not null references continents (id) on delete restrict,
  iso2         char(2) not null unique,   -- ISO 3166-1 alpha-2
  iso3         char(3) not null unique,   -- ISO 3166-1 alpha-3
  name         text not null,
  dial_code    text,                      -- e.g. '+62'
  created_at   timestamptz not null default now()
);

create index countries_continent_id_idx on countries (continent_id);

-- Baseline RLS (LANGKAH 1): authenticated = staff = full access.
-- Per-role rules come later (YAGNI). Seed below runs as the migration
-- role, which bypasses RLS.
alter table continents enable row level security;
alter table countries  enable row level security;

create policy "authenticated full access" on continents
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on countries
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Reference seed (idempotent). Curated set covering all continents plus the
-- jastip-relevant shopping/source destinations. Extend via Delivery Management.
-- ---------------------------------------------------------------------------
insert into continents (code, name) values
  ('AF', 'Africa'),
  ('AS', 'Asia'),
  ('EU', 'Europe'),
  ('NA', 'North America'),
  ('SA', 'South America'),
  ('OC', 'Oceania')
on conflict (code) do nothing;

insert into countries (continent_id, iso2, iso3, name, dial_code)
select c.id, v.iso2, v.iso3, v.name, v.dial_code
from (values
  -- Asia (jastip core)
  ('AS', 'ID', 'IDN', 'Indonesia',            '+62'),
  ('AS', 'SG', 'SGP', 'Singapore',            '+65'),
  ('AS', 'MY', 'MYS', 'Malaysia',             '+60'),
  ('AS', 'TH', 'THA', 'Thailand',             '+66'),
  ('AS', 'VN', 'VNM', 'Vietnam',              '+84'),
  ('AS', 'PH', 'PHL', 'Philippines',          '+63'),
  ('AS', 'JP', 'JPN', 'Japan',                '+81'),
  ('AS', 'KR', 'KOR', 'South Korea',          '+82'),
  ('AS', 'CN', 'CHN', 'China',                '+86'),
  ('AS', 'HK', 'HKG', 'Hong Kong',            '+852'),
  ('AS', 'TW', 'TWN', 'Taiwan',               '+886'),
  ('AS', 'IN', 'IND', 'India',                '+91'),
  ('AS', 'AE', 'ARE', 'United Arab Emirates', '+971'),
  ('AS', 'SA', 'SAU', 'Saudi Arabia',         '+966'),
  ('AS', 'QA', 'QAT', 'Qatar',                '+974'),
  ('AS', 'TR', 'TUR', 'Turkey',               '+90'),
  -- Europe
  ('EU', 'GB', 'GBR', 'United Kingdom',       '+44'),
  ('EU', 'FR', 'FRA', 'France',               '+33'),
  ('EU', 'DE', 'DEU', 'Germany',              '+49'),
  ('EU', 'IT', 'ITA', 'Italy',                '+39'),
  ('EU', 'ES', 'ESP', 'Spain',                '+34'),
  ('EU', 'NL', 'NLD', 'Netherlands',          '+31'),
  ('EU', 'CH', 'CHE', 'Switzerland',          '+41'),
  -- North America
  ('NA', 'US', 'USA', 'United States',        '+1'),
  ('NA', 'CA', 'CAN', 'Canada',               '+1'),
  ('NA', 'MX', 'MEX', 'Mexico',               '+52'),
  -- South America
  ('SA', 'BR', 'BRA', 'Brazil',               '+55'),
  -- Oceania
  ('OC', 'AU', 'AUS', 'Australia',            '+61'),
  ('OC', 'NZ', 'NZL', 'New Zealand',          '+64'),
  -- Africa
  ('AF', 'ZA', 'ZAF', 'South Africa',         '+27'),
  ('AF', 'EG', 'EGY', 'Egypt',                '+20')
) as v(continent_code, iso2, iso3, name, dial_code)
join continents c on c.code = v.continent_code
on conflict (iso2) do nothing;
