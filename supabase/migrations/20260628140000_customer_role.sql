-- 'customer' = external account, no internal access (it lived in the old
-- profiles.role CHECK but not in the roles table). Seed it as a zero-permission
-- role so it satisfies the new profiles.role FK and can mark customer logins.
insert into roles (name, description) values ('customer', 'Eksternal — tanpa akses internal')
on conflict (name) do nothing;
