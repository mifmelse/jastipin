-- Finance: money in (receivable) and money out (payable).
--
-- Anti double-count: payables is a derived UNION VIEW over the real cost sources
-- (sourcing actual, order shipping, trip_expenses) + a small manual 'other'
-- table. Amounts always live from source (never copied/stored). Paid/unpaid is a
-- thin overlay keyed by (source_type, source_id).

-- RECEIVABLE: money in from customers, per order.
create table payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  amount      numeric(14, 2) not null,
  currency    text not null default 'IDR',
  fx_rate     numeric not null default 1,
  method      text,
  paid_at     timestamptz,
  status      text not null default 'paid' check (status in ('pending', 'paid', 'refunded')),
  reference   text,
  recorded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payments_order_id_idx on payments (order_id);
create trigger payments_set_updated_at
  before update on payments for each row execute function set_updated_at();

-- Manual / 'other' payables — the only payables that aren't derived from a source.
create table manual_payables (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references trips (id) on delete set null,
  description text not null,
  category    text,
  amount      numeric(14, 2) not null,
  currency    text not null default 'IDR',
  fx_rate     numeric not null default 1,
  incurred_at date,
  recorded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger manual_payables_set_updated_at
  before update on manual_payables for each row execute function set_updated_at();

-- Settlement overlay: a row here means that payable is paid. Keyed by source.
create table payable_settlements (
  id          uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('sourcing', 'shipping', 'trip_expense', 'other')),
  source_id   uuid not null,
  status      text not null default 'paid' check (status in ('unpaid', 'paid')),
  paid_at     timestamptz,
  method      text,
  recorded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (source_type, source_id)
);
create trigger payable_settlements_set_updated_at
  before update on payable_settlements for each row execute function set_updated_at();

-- PAYABLE LEDGER (derived). One row per real cost; amount_idr is live.
create view payables as
with src as (
  -- sourcing actual cost (modal belanja)
  select 'sourcing'::text as source_type, ss.id as source_id, tr.trip_id,
         ss.actual_total as amount_idr, ss.currency,
         (ss.actual_price * ss.item_qty) as amount_src,
         ss.purchased_at::timestamptz as incurred_at,
         'Sourcing: ' || coalesce(oi.item_name, p.name, 'item') as description
  from sourcing_summaries ss
  join order_items oi on oi.id = ss.order_item_id
  left join products p on p.id = oi.product_id
  join orders o on o.id = oi.order_id
  join trip_routes tr on tr.id = o.trip_route_id
  where ss.actual_price is not null
  union all
  -- order shipping (ongkir last-mile)
  select 'shipping', o.id, tr.trip_id,
         o.shipping_cost * coalesce(o.fx_rate, 1), o.currency,
         o.shipping_cost, o.created_at,
         'Ongkir ' || o.code
  from orders o
  join trip_routes tr on tr.id = o.trip_route_id
  where coalesce(o.shipping_cost, 0) > 0
  union all
  -- trip operational expenses
  select 'trip_expense', e.id, e.trip_id,
         e.amount * coalesce(e.fx_rate, 1), e.currency,
         e.amount, e.spent_at::timestamptz,
         coalesce(e.category, 'Expense') || coalesce(' · ' || e.description, '')
  from trip_expenses e
  union all
  -- manual / other
  select 'other', m.id, m.trip_id,
         m.amount * coalesce(m.fx_rate, 1), m.currency,
         m.amount, m.incurred_at::timestamptz,
         m.description
  from manual_payables m
)
select src.*, coalesce(s.status, 'unpaid') as status, s.paid_at, s.method
from src
left join payable_settlements s on s.source_type = src.source_type and s.source_id = src.source_id;

-- RECEIVABLE per order: billed total vs collected (paid) → outstanding.
create view ar_per_order as
select
  o.id as order_id, o.code, o.created_at, o.status as order_status,
  c.name as customer_name,
  os.total_idr,
  coalesce(sum(case when p.status = 'paid' then p.amount * coalesce(p.fx_rate, 1) else 0 end), 0) as paid_idr,
  os.total_idr - coalesce(sum(case when p.status = 'paid' then p.amount * coalesce(p.fx_rate, 1) else 0 end), 0) as outstanding_idr
from orders o
join order_summaries os on os.id = o.id
join customers c on c.id = o.customer_id
left join payments p on p.order_id = o.id
group by o.id, c.name, os.total_idr;

-- Per-trip P&L: revenue (billed orders) − cost (payables) = profit.
create view trip_pnl as
select
  t.id as trip_id, t.code, t.name,
  coalesce(rev.revenue_idr, 0) as revenue_idr,
  coalesce(cost.cost_idr, 0) as cost_idr,
  coalesce(rev.revenue_idr, 0) - coalesce(cost.cost_idr, 0) as profit_idr
from trips t
left join (
  select tr.trip_id, sum(os.total_idr) as revenue_idr
  from orders o
  join order_summaries os on os.id = o.id
  join trip_routes tr on tr.id = o.trip_route_id
  where o.status not in ('cancelled', 'refunded')
  group by tr.trip_id
) rev on rev.trip_id = t.id
left join (
  select trip_id, sum(amount_idr) as cost_idr from payables group by trip_id
) cost on cost.trip_id = t.id;

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table payments            enable row level security;
alter table manual_payables     enable row level security;
alter table payable_settlements enable row level security;

create policy "authenticated full access" on payments
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on manual_payables
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on payable_settlements
  for all to authenticated using (true) with check (true);
