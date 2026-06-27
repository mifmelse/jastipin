-- Delivery: last-mile to the recipient after goods arrive at the leg's
-- destination. One shipment per order, tied to the delivery leg (trip_route).

create table shipments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders (id) on delete cascade,
  trip_route_id    uuid not null references trip_routes (id) on delete restrict,
  courier          text,
  tracking_no      text,
  status           text not null default 'pending'
                     check (status in ('pending', 'in_transit', 'delivered', 'failed')),
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  proof_url        text,
  recipient_signed boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index shipments_order_id_idx on shipments (order_id);
create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

-- Stamp shipped_at / delivered_at as the status advances (if not set manually).
create function shipment_stamp() returns trigger as $$
begin
  if new.status = 'in_transit' and new.shipped_at is null then new.shipped_at = now(); end if;
  if new.status = 'delivered' and new.delivered_at is null then new.delivered_at = now(); end if;
  return new;
end;
$$ language plpgsql;
create trigger shipments_stamp
  before insert or update on shipments
  for each row execute function shipment_stamp();

-- Delivered shipment → all its order's items + the order go 'delivered'
-- (forward-only). 'completed' stays a manual close (often after payment).
create function mirror_shipment_delivered() returns trigger as $$
begin
  if new.status = 'delivered' then
    update order_items
      set status = 'delivered'
      where order_id = new.order_id and status not in ('cancelled', 'delivered');
    update orders
      set status = 'delivered'
      where id = new.order_id and status not in ('cancelled', 'refunded', 'completed', 'delivered');
  end if;
  return new;
end;
$$ language plpgsql;
create trigger shipments_mirror_delivered
  after insert or update of status on shipments
  for each row execute function mirror_shipment_delivered();

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table shipments enable row level security;
create policy "authenticated full access" on shipments
  for all to authenticated using (true) with check (true);
