-- Auto-generate human-readable codes (PRD-0001, …) in the database.
-- Generic: trigger args = (prefix, sequence_name). Reused for trips/orders later.

create function set_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or new.code = '' then
    new.code := TG_ARGV[0] || '-' || lpad(nextval(TG_ARGV[1]::regclass)::text, 4, '0');
  end if;
  return new;
end;
$$;

create sequence products_code_seq;

create trigger products_set_code
  before insert on products
  for each row execute function set_code('PRD', 'products_code_seq');
