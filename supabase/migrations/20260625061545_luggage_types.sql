-- luggage_types: master definitions of carrier containers used in Load Planning.
-- Weight in grams, dimensions in mm (per architecture conventions).

create table luggage_types (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  category        text not null check (category in ('checked', 'cabin', 'personal')),
  max_weight_g    numeric not null,            -- batas berat muat (gram)
  tare_weight_g   numeric not null default 0,  -- berat kosong (gram)
  max_volume_cm3  numeric,                      -- kapasitas volume (opsional)
  inner_length_mm numeric,
  inner_width_mm  numeric,
  inner_height_mm numeric,
  regulation_note text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table luggage_types enable row level security;

create policy "authenticated full access" on luggage_types
  for all to authenticated using (true) with check (true);

insert into luggage_types (name, category, max_weight_g, tare_weight_g, regulation_note) values
  ('Koper Bagasi 28"', 'checked',  23000, 5000, 'Batas bagasi check-in umum 23kg'),
  ('Koper Kabin 20"',  'cabin',     7000, 3000, 'Kabin umumnya maks 7kg'),
  ('Backpack',         'personal',  8000, 1000, null),
  ('Totebag',          'personal',  5000,  300, null)
on conflict (name) do nothing;
