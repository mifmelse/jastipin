# Modules: Master Data & Settings

## MASTER DATA (grup)
### Geography — tabel continents, countries (SUDAH ADA)
- Tab: Continents · Countries. Dipakai lintas modul: product origin,
  trip routes, customer address, brand origin.
- **Dipindah dari "Delivery Management" lama** → ini Master Data, bukan Delivery.

### Luggage Types — tabel luggage_types (BARU)
- Master jenis wadah: name, category (checked/cabin/personal), max_weight_g,
  tare_weight_g, max_volume, dimensi dalam, regulation_note.
- Dipakai Load Planning untuk membuat instance `luggages`.

## SETTINGS (grup) — RBAC & Menu
### Tabel: roles, permissions, role_permissions, menus, profiles(ada)
- **Users** — kelola profiles/users + assign role.
- **Roles** — CRUD roles.
- **Permissions** — CRUD permissions (key `resource.action`).
- **Menu** — CRUD menu dynamic (parent_id, group, sort_order, required_permission).
- **User Types** — bila dipakai (kategori user tambahan).

> Detail lengkap RBAC & resolusi menu: lihat `../03-menu-rbac.md`.
> Ingat: permission MVP = UI visibility, RLS penuh menyusul (LANGKAH 2).
