-- Status-mirror triggers UPDATE order_items from OTHER tables (warehouse/load/
-- fulfillment/delivery). When a profile is deleted (auth user deletion), the FK
-- set-null updates on those tables fire these triggers as the supabase_auth_admin
-- role — which has no privileges on public.order_items → "permission denied" →
-- the whole user deletion 500s. Run them as the owner (postgres) instead.
alter function mirror_sourcing_status()    security definer set search_path = public;
alter function mirror_dropin_status()      security definer set search_path = public;
alter function mirror_warehouse_status()   security definer set search_path = public;
alter function mirror_shipment_delivered() security definer set search_path = public;
alter function sync_pack_status(uuid)      security definer set search_path = public;
alter function load_items_sync()           security definer set search_path = public;
