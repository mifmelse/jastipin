-- D1: single-row company profile — used on invoices (header/footer, bank/QRIS).
create table company_profile (
  id            int primary key default 1 check (id = 1),   -- enforce single row
  name          text not null default 'Bagasian',
  logo_url      text,
  address       text,
  phone         text,
  email         text,
  bank_name     text,
  bank_account  text,
  bank_holder   text,
  qris_url      text,
  invoice_note  text,                                        -- footer note on invoices
  updated_at    timestamptz not null default now()
);

insert into company_profile (id, name) values (1, 'Bagasian') on conflict (id) do nothing;

alter table company_profile enable row level security;
create policy "authenticated full access" on company_profile
  for all to authenticated using (true) with check (true);

-- Permissions (Settings = admin only) + menu
insert into permissions (key, description)
select 'company_profile.' || a.action, initcap(a.action) || ' company_profile'
from (values ('read'), ('write')) as a(action)
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'admin'
  and split_part(p.key, '.', 1) = 'company_profile'
on conflict do nothing;

insert into menus (label, icon, path, menu_group, sort_order, required_permission) values
  ('Company Profile', 'i-lucide-building', '/settings/company', 'Settings', 55, 'company_profile.read')
on conflict (path) do nothing;
