-- B5: quantity-aware packing. One order_item (e.g. 3 pcs) can be split across
-- luggages — load_items now carries how many units sit in a given luggage on a
-- given leg. Status advances to 'packed' only when ALL units are placed.

alter table load_items add column qty int not null default 1 check (qty > 0);

-- Same item may now appear in the same luggage on different legs (carry-over),
-- but only once per (luggage, item, leg) — units aggregate into that one row.
alter table load_items drop constraint load_items_luggage_id_order_item_id_key;
alter table load_items add constraint load_items_luggage_item_route_key
  unique (luggage_id, order_item_id, trip_route_id);

-- ---------------------------------------------------------------------------
-- Status mirror: packed only when fully placed on the item's own leg.
-- ---------------------------------------------------------------------------
drop trigger load_items_mirror_status on load_items;
drop trigger load_items_unmirror_status on load_items;
drop function mirror_load_status();
drop function unmirror_load_status();

create function sync_pack_status(p_item uuid) returns void as $$
declare
  v_qty int;
  v_route uuid;
  v_status text;
  v_placed int;
begin
  select oi.qty, o.trip_route_id, oi.status
    into v_qty, v_route, v_status
    from order_items oi join orders o on o.id = oi.order_id
    where oi.id = p_item;
  -- never override later lifecycle states (loaded / delivered / …)
  if v_status is null or v_status not in ('in_warehouse', 'packed') then
    return;
  end if;
  select coalesce(sum(qty), 0) into v_placed
    from load_items where order_item_id = p_item and trip_route_id = v_route;
  update order_items
    set status = case when v_placed >= v_qty then 'packed' else 'in_warehouse' end
    where id = p_item;
end;
$$ language plpgsql;

create function load_items_sync() returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform sync_pack_status(OLD.order_item_id);
    return OLD;
  end if;
  perform sync_pack_status(NEW.order_item_id);
  return NEW;
end;
$$ language plpgsql;

create trigger load_items_sync_status
  after insert or update or delete on load_items
  for each row execute function load_items_sync();

-- ---------------------------------------------------------------------------
-- Simulation now weighs per LOAD_ITEM units (li.qty), not the whole order line.
-- ---------------------------------------------------------------------------
create or replace view luggage_simulation as
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
  coalesce(sum(li.qty * coalesce(w.weighed_g, oi.weight_g, p.weight_g, 0)), 0) as loaded_weight_g,
  coalesce(sum(
    li.qty * (coalesce(w.length_mm, oi.length_mm) * coalesce(w.width_mm, oi.width_mm)
              * coalesce(w.height_mm, oi.height_mm) / 1000.0)
  ), 0) as loaded_volume_cm3,
  coalesce(sum(li.qty), 0) as item_count
from luggages l
join luggage_types lt on lt.id = l.luggage_type_id
left join load_items li on li.luggage_id = l.id
left join order_items oi on oi.id = li.order_item_id
left join products p on p.id = oi.product_id
left join warehouse_items w on w.order_item_id = oi.id
group by l.id, lt.id;
