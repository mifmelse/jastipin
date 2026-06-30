-- D2: persisted invoices for orders (INV- auto via shared set_code). Totals stay
-- derived — the printable invoice renders live order figures; this record holds
-- the code, dates and status.
create sequence invoices_code_seq;

create table invoices (
  id          uuid primary key default gen_random_uuid(),
  code        text unique,                                   -- INV-xxxx (auto)
  order_id    uuid not null references orders (id) on delete cascade,
  issued_at   date not null default current_date,
  due_at      date,
  status      text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index invoices_order_id_idx on invoices (order_id);

create trigger invoices_set_code
  before insert on invoices
  for each row execute function set_code('INV', 'invoices_code_seq');
create trigger invoices_set_updated_at
  before update on invoices
  for each row execute function set_updated_at();

alter table invoices enable row level security;
create policy "authenticated full access" on invoices
  for all to authenticated using (true) with check (true);

-- Permissions (Finance = admin + staff) + menu
insert into permissions (key, description)
select 'invoices.' || a.action, initcap(a.action) || ' invoices'
from (values ('read'), ('write'), ('delete')) as a(action)
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name in ('admin', 'staff')
  and split_part(p.key, '.', 1) = 'invoices'
on conflict do nothing;

insert into menus (label, icon, path, menu_group, sort_order, required_permission) values
  ('Invoices', 'i-lucide-file-text', '/finance/invoices', 'Finance', 29, 'invoices.read')
on conflict (path) do nothing;
