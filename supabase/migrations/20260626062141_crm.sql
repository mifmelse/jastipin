-- CRM & Customers: contacts, recipient addresses, sales pipeline, activity log.

create table customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  gender     text check (gender is null or gender in ('male', 'female', 'other')),
  country_id uuid references countries (id) on delete set null,
  image_url  text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_set_updated_at
  before update on customers for each row execute function set_updated_at();

-- Recipient (penerima) can differ from the customer (penitip).
create table customer_addresses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers (id) on delete cascade,
  label           text,
  recipient_name  text,
  recipient_phone text,
  address_line    text,
  city            text,
  postal_code     text,
  country_id      uuid references countries (id) on delete set null,
  notes           text
);
create index customer_addresses_customer_id_idx on customer_addresses (customer_id);

create table crm_pipeline (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers (id) on delete set null,
  contact_name   text,
  contact_phone  text,
  source         text,
  stage          text not null default 'reach'
                   check (stage in ('reach', 'lead', 'conversation', 'order', 'repeat')),
  trip_id        uuid references trips (id) on delete set null,
  value_estimate numeric,
  owner          uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index crm_pipeline_stage_idx on crm_pipeline (stage);
create trigger crm_pipeline_set_updated_at
  before update on crm_pipeline for each row execute function set_updated_at();

create table crm_activities (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references crm_pipeline (id) on delete cascade,
  type        text not null check (type in ('note', 'call', 'message', 'follow_up')),
  content     text,
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index crm_activities_pipeline_id_idx on crm_activities (pipeline_id);

alter table customers          enable row level security;
alter table customer_addresses enable row level security;
alter table crm_pipeline       enable row level security;
alter table crm_activities     enable row level security;

create policy "authenticated full access" on customers
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on customer_addresses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on crm_pipeline
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on crm_activities
  for all to authenticated using (true) with check (true);
