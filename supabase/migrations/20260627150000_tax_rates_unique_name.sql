-- A6 follow-up: tax_rates lacked a natural key, so Excel import couldn't upsert
-- idempotently. Add a unique name (seeds are already unique).
alter table tax_rates add constraint tax_rates_name_key unique (name);
