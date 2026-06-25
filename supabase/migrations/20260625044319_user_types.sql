-- user_types: master list of user categories (managed under Settings).
-- profiles.user_type holds the chosen name (loose text reference for now).

create table user_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table user_types enable row level security;

create policy "authenticated full access" on user_types
  for all to authenticated using (true) with check (true);

insert into user_types (name, description) values
  ('Regular', 'Customer reguler'),
  ('VIP',     'Customer prioritas')
on conflict (name) do nothing;
