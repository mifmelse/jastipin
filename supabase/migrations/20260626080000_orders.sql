-- Order Management: the core transaction.
-- An order = 1 customer for 1 leg (trip_route). Items = catalog product or
-- free-text drop-in. Money lives in ONE order currency (+ frozen fx to IDR);
-- subtotal/total are DERIVED (never stored) — see view `order_summaries`.

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique,                          -- ORD-xxxx (auto)
  customer_id         uuid not null references customers (id) on delete restrict,
  trip_route_id       uuid not null references trip_routes (id) on delete restrict,
  shipping_address_id uuid references customer_addresses (id) on delete set null,
  status              text not null default 'draft'
                        check (status in ('draft', 'confirmed', 'paid', 'fulfilling',
                          'packed', 'in_transit', 'delivered', 'completed',
                          'cancelled', 'refunded')),
  fee                 numeric not null default 0,           -- service fee (input)
  shipping_cost       numeric not null default 0,           -- last-mile (input)
  currency            text not null default 'IDR',
  fx_rate             numeric not null default 1,           -- frozen rate → IDR
  notes               text,
  created_by          uuid references profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_customer_id_idx   on orders (customer_id);
create index orders_trip_route_id_idx on orders (trip_route_id);

create sequence orders_code_seq;
create trigger orders_set_code
  before insert on orders
  for each row execute function set_code('ORD', 'orders_code_seq');
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders (id) on delete cascade,
  product_id      uuid references products (id) on delete set null,
  item_name       text,                                     -- required when product_id is null
  fulfillment_type text not null default 'sourcing'
                    check (fulfillment_type in ('sourcing', 'drop_in')),
  qty             int not null default 1 check (qty > 0),
  unit_id         uuid references units (id) on delete set null,
  requested_price numeric,                                  -- quoted to customer (drives total)
  actual_price    numeric,                                  -- actually paid (feeds payable later)
  weight_g        numeric,
  length_mm       numeric,
  width_mm        numeric,
  height_mm       numeric,
  status          text not null default 'pending'
                    check (status in ('pending', 'sourcing', 'purchased', 'received',
                      'out_of_stock', 'in_warehouse', 'packed', 'delivered', 'cancelled')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- a row is either a catalog product or a named free-text item
  constraint order_items_product_or_name check (product_id is not null or item_name is not null)
);
create index order_items_order_id_idx on order_items (order_id);

create trigger order_items_set_updated_at
  before update on order_items
  for each row execute function set_updated_at();

-- Derived money, computed from source-of-truth items (never stored as columns).
-- subtotal = Σ qty × requested_price ; total = subtotal + fee + shipping_cost.
-- total_idr applies the order's frozen fx_rate.
create view order_summaries as
select
  o.*,
  coalesce(t.subtotal, 0)                                                              as subtotal,
  coalesce(t.subtotal, 0) + coalesce(o.fee, 0) + coalesce(o.shipping_cost, 0)          as total,
  (coalesce(t.subtotal, 0) + coalesce(o.fee, 0) + coalesce(o.shipping_cost, 0))
    * coalesce(o.fx_rate, 1)                                                           as total_idr,
  coalesce(t.item_count, 0)                                                            as item_count
from orders o
left join (
  select order_id,
         sum(qty * coalesce(requested_price, 0)) as subtotal,
         count(*)                                as item_count
  from order_items
  group by order_id
) t on t.order_id = o.id;

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table orders      enable row level security;
alter table order_items enable row level security;

create policy "authenticated full access" on orders
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on order_items
  for all to authenticated using (true) with check (true);
