-- Master data: currencies + tax rates. Plus fx_rate on foreign-currency
-- transactions so amounts can be reported in the base currency (IDR).

create table currencies (
  id        uuid primary key default gen_random_uuid(),
  code      text not null unique,   -- ISO 4217, e.g. 'IDR'
  name      text not null,
  symbol    text,
  is_active boolean not null default true
);

create table tax_rates (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  rate      numeric not null default 0,   -- percent, e.g. 11 for PPN 11%
  is_active boolean not null default true
);

-- fx_rate to base IDR, frozen at transaction time (1 when already IDR).
alter table trip_bookings add column fx_rate numeric not null default 1;
alter table trip_expenses add column fx_rate numeric not null default 1;

alter table currencies enable row level security;
alter table tax_rates  enable row level security;

create policy "authenticated full access" on currencies
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tax_rates
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
insert into currencies (code, name, symbol) values
  ('IDR', 'Indonesian Rupiah', 'Rp'),
  ('USD', 'US Dollar', '$'),
  ('SGD', 'Singapore Dollar', 'S$'),
  ('JPY', 'Japanese Yen', '¥'),
  ('KRW', 'South Korean Won', '₩'),
  ('CNY', 'Chinese Yuan', '¥'),
  ('HKD', 'Hong Kong Dollar', 'HK$'),
  ('MYR', 'Malaysian Ringgit', 'RM'),
  ('THB', 'Thai Baht', '฿'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('AED', 'UAE Dirham', 'د.إ')
on conflict (code) do nothing;

insert into tax_rates (name, rate) values
  ('PPN 11%', 11),
  ('Tanpa pajak', 0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Permissions + menu (dynamic) for the two new master pages
-- ---------------------------------------------------------------------------
insert into permissions (key, description)
select r.resource || '.' || a.action, initcap(a.action) || ' ' || r.resource
from (values ('currencies'), ('tax_rates')) as r(resource)
cross join (values ('read'), ('write'), ('delete')) as a(action)
on conflict (key) do nothing;

-- grant to admin (everything) and staff (master data is non-settings)
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name in ('admin', 'staff')
  and split_part(p.key, '.', 1) in ('currencies', 'tax_rates')
on conflict do nothing;

insert into menus (label, icon, path, menu_group, sort_order, required_permission) values
  ('Currencies', 'i-lucide-coins',   '/master-data/currencies', 'Master Data', 42, 'currencies.read'),
  ('Tax Rates',  'i-lucide-percent', '/master-data/tax-rates',  'Master Data', 43, 'tax_rates.read')
on conflict (path) do nothing;
