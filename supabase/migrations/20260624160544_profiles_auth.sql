-- Profiles: extends auth.users with role/profile data.
-- One row is created automatically per auth user via trigger.

create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'staff'
               check (role in ('admin', 'staff', 'customer')),
  user_type  text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever an auth user is created.
-- SECURITY DEFINER so it can write to profiles regardless of the caller's RLS.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Baseline RLS (LANGKAH 1): authenticated staff can read all profiles and
-- edit their own. Role management / per-role rules come later (YAGNI).
alter table profiles enable row level security;

create policy "authenticated can read profiles" on profiles
  for select to authenticated using (true);

create policy "users can update own profile" on profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
