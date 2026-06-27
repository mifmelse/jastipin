-- Warehouse: goods at rest in our place. Intake, sort, condition, ACTUAL weigh.
-- One warehouse_item per order_item (unique). Weighed/measured values here are
-- authoritative over product estimates for packing simulation (Load Planning).

create table warehouse_items (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references order_items (id) on delete cascade,
  location      text,                                       -- rak / bin
  condition     text not null default 'good'
                  check (condition in ('good', 'damaged', 'missing')),
  intake_at     timestamptz not null default now(),
  intake_by     uuid references profiles (id) on delete set null,
  weighed_g     numeric,                                    -- actual weight (overrides estimate)
  length_mm     numeric,
  width_mm      numeric,
  height_mm     numeric,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger warehouse_items_set_updated_at
  before update on warehouse_items
  for each row execute function set_updated_at();

-- Intake drives the item to 'in_warehouse' (forward-only: don't regress an item
-- that already moved on to packed/delivered).
create function mirror_warehouse_status() returns trigger as $$
begin
  update order_items
    set status = 'in_warehouse'
    where id = new.order_item_id
      and status in ('purchased', 'received', 'in_warehouse');
  return new;
end;
$$ language plpgsql;
create trigger warehouse_mirror_status
  after insert or update on warehouse_items
  for each row execute function mirror_warehouse_status();

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table warehouse_items enable row level security;
create policy "authenticated full access" on warehouse_items
  for all to authenticated using (true) with check (true);
