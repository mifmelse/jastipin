-- A4: 5 operational masters (picker lists). Operations store a TEXT SNAPSHOT of
-- the chosen name at record time (frozen, like fx_rate) — these tables are the
-- suggestion lists, NOT foreign keys. Renaming/deleting a master therefore never
-- affects past transactions. Uniform shape so one reusable CRUD UI fits all five.

create table expense_categories ( id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now() );
create table lead_sources       ( id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now() );
create table stores             ( id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now() );
create table couriers           ( id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now() );
create table payment_methods    ( id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now() );

alter table expense_categories enable row level security;
alter table lead_sources       enable row level security;
alter table stores             enable row level security;
alter table couriers           enable row level security;
alter table payment_methods    enable row level security;

create policy "authenticated full access" on expense_categories for all to authenticated using (true) with check (true);
create policy "authenticated full access" on lead_sources       for all to authenticated using (true) with check (true);
create policy "authenticated full access" on stores             for all to authenticated using (true) with check (true);
create policy "authenticated full access" on couriers           for all to authenticated using (true) with check (true);
create policy "authenticated full access" on payment_methods    for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed sensible defaults (editable by the user)
-- ---------------------------------------------------------------------------
insert into expense_categories (name) values ('Makan'), ('Transport'), ('Akomodasi'), ('Tiket'), ('Belanja barang'), ('Lain-lain') on conflict (name) do nothing;
insert into lead_sources (name)       values ('Instagram'), ('WhatsApp'), ('TikTok'), ('Teman/Referral'), ('Marketplace') on conflict (name) do nothing;
insert into stores (name)             values ('Daiso'), ('Don Quijote'), ('Uniqlo'), ('Apple Store'), ('Drugstore') on conflict (name) do nothing;
insert into couriers (name)           values ('JNE'), ('J&T'), ('SiCepat'), ('GoSend'), ('GrabExpress'), ('AnterAja') on conflict (name) do nothing;
insert into payment_methods (name)    values ('Transfer Bank'), ('QRIS'), ('Cash'), ('E-wallet') on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Permissions + menu (mirrors the currencies/tax_rates master pattern)
-- ---------------------------------------------------------------------------
insert into permissions (key, description)
select r.resource || '.' || a.action, initcap(a.action) || ' ' || r.resource
from (values ('expense_categories'), ('lead_sources'), ('stores'), ('couriers'), ('payment_methods')) as r(resource)
cross join (values ('read'), ('write'), ('delete')) as a(action)
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name in ('admin', 'staff')
  and split_part(p.key, '.', 1) in ('expense_categories', 'lead_sources', 'stores', 'couriers', 'payment_methods')
on conflict do nothing;

insert into menus (label, icon, path, menu_group, sort_order, required_permission) values
  ('Expense Categories', 'i-lucide-receipt',     '/master-data/expense-categories', 'Master Data', 44, 'expense_categories.read'),
  ('Lead Sources',       'i-lucide-megaphone',   '/master-data/lead-sources',       'Master Data', 45, 'lead_sources.read'),
  ('Stores',             'i-lucide-store',        '/master-data/stores',             'Master Data', 46, 'stores.read'),
  ('Couriers',           'i-lucide-truck',        '/master-data/couriers',           'Master Data', 47, 'couriers.read'),
  ('Payment Methods',    'i-lucide-credit-card',  '/master-data/payment-methods',    'Master Data', 48, 'payment_methods.read')
on conflict (path) do nothing;
