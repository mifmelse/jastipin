-- Load Planning: pack goods into luggage with weight/volume simulation.
-- luggages = instances of luggage_types for a trip. load_items = an order_item
-- placed into a luggage FOR A SPECIFIC LEG (trip_route) — the leg is what makes
-- carry-over possible (one item can ride different legs).

create table luggages (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references trips (id) on delete cascade,
  luggage_type_id   uuid not null references luggage_types (id) on delete restrict,
  assigned_traveler uuid references profiles (id) on delete set null,
  label             text not null,                          -- "Koper A"
  status            text not null default 'planned'
                      check (status in ('planned', 'packed', 'loaded', 'unloaded')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index luggages_trip_id_idx on luggages (trip_id);
create trigger luggages_set_updated_at
  before update on luggages
  for each row execute function set_updated_at();

create table load_items (
  id            uuid primary key default gen_random_uuid(),
  luggage_id    uuid not null references luggages (id) on delete cascade,
  order_item_id uuid not null references order_items (id) on delete cascade,
  trip_route_id uuid not null references trip_routes (id) on delete restrict,
  placed_at     timestamptz not null default now(),
  placed_by     uuid references profiles (id) on delete set null,
  unique (luggage_id, order_item_id)                        -- same item once per luggage
);
create index load_items_luggage_id_idx on load_items (luggage_id);
create index load_items_order_item_id_idx on load_items (order_item_id);

-- Packing an item → 'packed' (forward-only). Unpacking the LAST placement of an
-- item returns it to 'in_warehouse' (carry-over: it may still sit in other legs).
create function mirror_load_status() returns trigger as $$
begin
  update order_items
    set status = 'packed'
    where id = new.order_item_id
      and status in ('in_warehouse', 'packed');
  return new;
end;
$$ language plpgsql;
create trigger load_items_mirror_status
  after insert on load_items
  for each row execute function mirror_load_status();

create function unmirror_load_status() returns trigger as $$
begin
  if not exists (select 1 from load_items where order_item_id = old.order_item_id) then
    update order_items
      set status = 'in_warehouse'
      where id = old.order_item_id and status = 'packed';
  end if;
  return old;
end;
$$ language plpgsql;
create trigger load_items_unmirror_status
  after delete on load_items
  for each row execute function unmirror_load_status();

-- Per-luggage simulation. Weight is per-unit × qty (actual weigh wins, else
-- item/product estimate). Volume best-effort from actual/estimated dims.
-- Derived — never stored.
create view luggage_simulation as
select
  l.id              as luggage_id,
  l.trip_id,
  l.label,
  l.status,
  lt.name           as type_name,
  lt.category,
  lt.max_weight_g,
  lt.tare_weight_g,
  lt.max_volume_cm3,
  lt.regulation_note,
  coalesce(sum(oi.qty * coalesce(w.weighed_g, oi.weight_g, p.weight_g, 0)), 0) as loaded_weight_g,
  coalesce(sum(
    oi.qty * (coalesce(w.length_mm, oi.length_mm) * coalesce(w.width_mm, oi.width_mm)
              * coalesce(w.height_mm, oi.height_mm) / 1000.0)
  ), 0) as loaded_volume_cm3,
  count(li.id)      as item_count
from luggages l
join luggage_types lt on lt.id = l.luggage_type_id
left join load_items li on li.luggage_id = l.id
left join order_items oi on oi.id = li.order_item_id
left join products p on p.id = oi.product_id
left join warehouse_items w on w.order_item_id = oi.id
group by l.id, lt.id;

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table luggages   enable row level security;
alter table load_items enable row level security;

create policy "authenticated full access" on luggages
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on load_items
  for all to authenticated using (true) with check (true);
