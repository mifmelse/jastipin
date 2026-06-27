-- Fulfillment: how goods reach us. Two paths keyed by order_items.fulfillment_type.
--   sourcing  → sourcing_records  (shopper buys abroad)
--   drop_in   → drop_in_intakes   (customer ships their own item)
-- LOCKED: separate detail tables (not just a status on order_items) — the shopper
-- workspace needs rich data (receipt, actual price, fx, store, substitution, photo).

create table sourcing_records (
  id              uuid primary key default gen_random_uuid(),
  order_item_id   uuid not null unique references order_items (id) on delete cascade,
  shopper_id      uuid references profiles (id) on delete set null,
  store_name      text,
  purchased_at    timestamptz,
  actual_price    numeric,                                  -- per unit, in origin currency
  currency        text not null default 'IDR',
  fx_rate         numeric not null default 1,               -- frozen rate → IDR
  is_substitute   boolean not null default false,
  substitute_note text,
  receipt_url     text,
  note            text,
  status          text not null default 'pending'
                    check (status in ('pending', 'sourcing', 'purchased', 'out_of_stock')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger sourcing_records_set_updated_at
  before update on sourcing_records
  for each row execute function set_updated_at();

create table drop_in_intakes (
  id              uuid primary key default gen_random_uuid(),
  order_item_id   uuid not null unique references order_items (id) on delete cascade,
  received_at     timestamptz not null default now(),
  received_by     uuid references profiles (id) on delete set null,
  courier_from    text,
  condition       text not null default 'good' check (condition in ('good', 'damaged')),
  condition_note  text,
  photo_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger drop_in_intakes_set_updated_at
  before update on drop_in_intakes
  for each row execute function set_updated_at();

-- Constraint: a fulfillment record must match its item's fulfillment_type.
-- (sourcing_records only for 'sourcing' items, drop_in_intakes only for 'drop_in'.)
create function assert_item_fulfillment_type() returns trigger as $$
declare
  ft       text;
  expected text := tg_argv[0];
begin
  select fulfillment_type into ft from order_items where id = new.order_item_id;
  if ft is null then
    raise exception 'order_item % not found', new.order_item_id;
  end if;
  if ft <> expected then
    raise exception 'order_item % is "%", cannot attach a % record', new.order_item_id, ft, expected;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger sourcing_match_type
  before insert or update on sourcing_records
  for each row execute function assert_item_fulfillment_type('sourcing');
create trigger drop_in_match_type
  before insert or update on drop_in_intakes
  for each row execute function assert_item_fulfillment_type('drop_in');

-- Status is driven by the fulfillment process (docs: "disetir oleh proses di sini").
-- Forward-only: never drag an item back once it has moved past fulfillment
-- (in_warehouse / packed / delivered / cancelled).
create function mirror_sourcing_status() returns trigger as $$
begin
  update order_items
    set status = new.status
    where id = new.order_item_id
      and status in ('pending', 'sourcing', 'purchased', 'out_of_stock');
  return new;
end;
$$ language plpgsql;
create trigger sourcing_mirror_status
  after insert or update of status on sourcing_records
  for each row execute function mirror_sourcing_status();

create function mirror_dropin_status() returns trigger as $$
begin
  update order_items
    set status = 'received'
    where id = new.order_item_id
      and status in ('pending', 'received');
  return new;
end;
$$ language plpgsql;
create trigger dropin_mirror_status
  after insert or update on drop_in_intakes
  for each row execute function mirror_dropin_status();

-- actual_total = actual_price × qty × fx_rate (→ Finance Payable, kategori sourcing).
-- Derived (qty lives on order_items), so computed in a view — never stored.
create view sourcing_summaries as
select
  s.*,
  coalesce(s.actual_price, 0) * oi.qty * coalesce(s.fx_rate, 1) as actual_total,
  oi.qty as item_qty
from sourcing_records s
join order_items oi on oi.id = s.order_item_id;

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table sourcing_records enable row level security;
alter table drop_in_intakes  enable row level security;

create policy "authenticated full access" on sourcing_records
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on drop_in_intakes
  for all to authenticated using (true) with check (true);
