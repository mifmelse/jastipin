-- Catalog: brands, categories, sub_categories, units, products.
-- One product entity (brand/category/sub/unit/country). Weight in grams,
-- dimensions in mm. Money numeric + currency (default IDR).

create table brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  country_id uuid references countries (id) on delete set null,
  logo_url   text,
  is_active  boolean not null default true
);

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true
);

create table sub_categories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  unique (category_id, name)
);

create table units (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  symbol    text,
  is_active boolean not null default true
);

create table products (
  id              uuid primary key default gen_random_uuid(),
  code            text unique,
  name            text not null,
  description     text,
  brand_id        uuid references brands (id) on delete set null,
  category_id     uuid not null references categories (id) on delete restrict,
  sub_category_id uuid references sub_categories (id) on delete set null,
  unit_id         uuid not null references units (id) on delete restrict,
  country_id      uuid references countries (id) on delete set null,  -- origin
  weight_g        numeric not null,            -- WAJIB untuk packing
  length_mm       numeric,
  width_mm        numeric,
  height_mm       numeric,
  base_price      numeric,
  cost_price      numeric,
  currency        text not null default 'IDR',
  image_url       text,                        -- Supabase Storage (uploader menyusul)
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_category_id_idx on products (category_id);
create index products_brand_id_idx on products (brand_id);

-- Keep products.updated_at fresh on edit.
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Baseline RLS (LANGKAH 1): authenticated = full access.
alter table brands         enable row level security;
alter table categories     enable row level security;
alter table sub_categories enable row level security;
alter table units          enable row level security;
alter table products       enable row level security;

create policy "authenticated full access" on brands
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on categories
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sub_categories
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on units
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on products
  for all to authenticated using (true) with check (true);

-- Seed a few common units to start.
insert into units (name, symbol) values
  ('Piece', 'pcs'),
  ('Box', 'box'),
  ('Pair', 'pair'),
  ('Set', 'set'),
  ('Pack', 'pack')
on conflict (name) do nothing;
