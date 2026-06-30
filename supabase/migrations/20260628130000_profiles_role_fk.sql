-- profiles.role was pinned to a static CHECK (admin/staff/customer) that ignored
-- roles created later via the Roles page (e.g. 'developer') — so those roles
-- couldn't be assigned. Make role follow the roles table instead: a FK to
-- roles(name). Renames cascade; a role can't be dropped while still assigned.
alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_fkey
  foreign key (role) references roles (name) on update cascade on delete restrict;
