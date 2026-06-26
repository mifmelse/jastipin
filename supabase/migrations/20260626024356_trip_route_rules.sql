-- When a trip's type changes, its existing legs no longer fit the new rules
-- (single=1, round=2, multi=N), so reset them. Done in the DB so it's atomic
-- with the type change regardless of caller.
create function reset_routes_on_type_change()
returns trigger
language plpgsql
as $$
begin
  if new.type is distinct from old.type then
    delete from trip_routes where trip_id = new.id;
  end if;
  return new;
end;
$$;

create trigger trips_reset_routes_on_type_change
  after update on trips
  for each row execute function reset_routes_on_type_change();
