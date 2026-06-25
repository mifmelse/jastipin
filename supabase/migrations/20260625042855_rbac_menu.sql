-- RBAC + dynamic menu (FASE 1 backbone).
-- Permissions drive UI visibility only in MVP; real RLS stays LANGKAH 1
-- (authenticated full access). User → permissions resolves by matching
-- profiles.role (text) to roles.name (text).

-- FASE 0 leftover: add field role `traveler`.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'staff', 'traveler', 'customer'));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text
);

create table permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,    -- '<resource>.<action>', e.g. 'trips.read'
  description text
);

create table role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references roles (id) on delete cascade,
  permission_id uuid not null references permissions (id) on delete cascade,
  unique (role_id, permission_id)
);

create index role_permissions_role_id_idx on role_permissions (role_id);

create table menus (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid references menus (id) on delete cascade,  -- reserved (max 2 levels via menu_group in MVP)
  label               text not null,
  icon                text,
  path                text unique,
  menu_group          text,            -- Operations | Catalog | Finance | Master Data | Settings (null = top-level)
  sort_order          int not null default 0,
  required_permission text references permissions (key) on delete set null,  -- null = visible to all authenticated
  is_active           boolean not null default true
);

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table roles            enable row level security;
alter table permissions      enable row level security;
alter table role_permissions enable row level security;
alter table menus            enable row level security;

create policy "authenticated full access" on roles
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on permissions
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on role_permissions
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on menus
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed: roles
-- ---------------------------------------------------------------------------
insert into roles (name, description) values
  ('admin',    'Akses penuh'),
  ('staff',    'Operasional harian per management'),
  ('traveler', 'Staff lapangan: fulfillment, packing, delivery'),
  ('customer', 'Pemesan (dikelola via CRM)')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: permissions = resource x action (read | write | delete)
-- ---------------------------------------------------------------------------
insert into permissions (key, description)
select r.resource || '.' || a.action,
       initcap(a.action) || ' ' || r.resource
from (values
  ('trips'), ('crm'), ('orders'), ('fulfillment'), ('warehouse'),
  ('load_planning'), ('delivery'),
  ('products'), ('brands'), ('categories'), ('units'),
  ('receivables'), ('payables'), ('trip_expenses'), ('reports'),
  ('geography'), ('luggage_types'),
  ('users'), ('roles'), ('permissions'), ('menu'), ('user_types')
) as r(resource)
cross join (values ('read'), ('write'), ('delete')) as a(action)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: role_permissions
-- ---------------------------------------------------------------------------
-- admin → everything
insert into role_permissions (role_id, permission_id)
select (select id from roles where name = 'admin'), p.id
from permissions p
on conflict do nothing;

-- staff → everything except Settings resources
insert into role_permissions (role_id, permission_id)
select (select id from roles where name = 'staff'), p.id
from permissions p
where split_part(p.key, '.', 1) not in ('users', 'roles', 'permissions', 'menu', 'user_types')
on conflict do nothing;

-- traveler → field work: trips (read) + read/write on fulfillment/warehouse/load_planning/delivery
insert into role_permissions (role_id, permission_id)
select (select id from roles where name = 'traveler'), p.id
from permissions p
where p.key = 'trips.read'
   or (split_part(p.key, '.', 1) in ('fulfillment', 'warehouse', 'load_planning', 'delivery')
       and split_part(p.key, '.', 2) in ('read', 'write'))
on conflict do nothing;

-- customer → none for now.

-- ---------------------------------------------------------------------------
-- Seed: menus (hierarchy from 03-menu-rbac.md)
-- ---------------------------------------------------------------------------
insert into menus (label, icon, path, menu_group, sort_order, required_permission) values
  ('Dashboard',     'i-lucide-layout-dashboard', '/',                          null,          0,  null),

  ('Trips',         'i-lucide-plane',            '/operations/trips',          'Operations',  10, 'trips.read'),
  ('CRM',           'i-lucide-users-round',      '/operations/crm',            'Operations',  11, 'crm.read'),
  ('Orders',        'i-lucide-shopping-cart',    '/operations/orders',         'Operations',  12, 'orders.read'),
  ('Fulfillment',   'i-lucide-package-search',   '/operations/fulfillment',    'Operations',  13, 'fulfillment.read'),
  ('Warehouse',     'i-lucide-warehouse',        '/operations/warehouse',      'Operations',  14, 'warehouse.read'),
  ('Load Planning', 'i-lucide-boxes',            '/operations/load-planning',  'Operations',  15, 'load_planning.read'),
  ('Delivery',      'i-lucide-truck',            '/operations/delivery',       'Operations',  16, 'delivery.read'),

  ('Products',      'i-lucide-package',          '/catalog/products',          'Catalog',     20, 'products.read'),
  ('Brands',        'i-lucide-tag',              '/catalog/brands',            'Catalog',     21, 'brands.read'),
  ('Categories',    'i-lucide-folder-tree',      '/catalog/categories',        'Catalog',     22, 'categories.read'),
  ('Units',         'i-lucide-ruler',            '/catalog/units',             'Catalog',     23, 'units.read'),

  ('Receivables',   'i-lucide-circle-arrow-down','/finance/receivables',       'Finance',     30, 'receivables.read'),
  ('Payables',      'i-lucide-circle-arrow-up',  '/finance/payables',          'Finance',     31, 'payables.read'),
  ('Trip Expenses', 'i-lucide-receipt',          '/finance/trip-expenses',     'Finance',     32, 'trip_expenses.read'),
  ('Reports',       'i-lucide-chart-column',     '/finance/reports',           'Finance',     33, 'reports.read'),

  ('Geography',     'i-lucide-globe',            '/master-data/geography',     'Master Data', 40, 'geography.read'),
  ('Luggage Types', 'i-lucide-luggage',          '/master-data/luggage-types', 'Master Data', 41, 'luggage_types.read'),

  ('Users',         'i-lucide-user-cog',         '/settings/users',            'Settings',    50, 'users.read'),
  ('Roles',         'i-lucide-shield',           '/settings/roles',            'Settings',    51, 'roles.read'),
  ('Permissions',   'i-lucide-key-round',        '/settings/permissions',      'Settings',    52, 'permissions.read'),
  ('Menu',          'i-lucide-menu',             '/settings/menu',             'Settings',    53, 'menu.read'),
  ('User Types',    'i-lucide-users',            '/settings/user-types',       'Settings',    54, 'user_types.read')
on conflict (path) do nothing;
