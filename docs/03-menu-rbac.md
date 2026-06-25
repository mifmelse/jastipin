# Menu & RBAC (Dynamic)

Menu **dynamic dari DB**. Sidebar dirender dari tabel `menus`, difilter oleh
permission user. Permission MVP = **UI visibility only** (bukan RLS — lihat
`01-architecture.md`).

## Aturan menu

- Grouping: **min 2 anak per grup**, **max 2 level** (Group → Item).
- Lebih dalam dari 2 level = **tab di dalam halaman**, bukan menu.
- Group dengan 1 anak → flatten jadi top-level sampai anak ke-2 lahir.
- Dashboard = satu-satunya item top-level tanpa grup.

## Hierarki final (seed `menus`)

```
Dashboard                         (top-level)

OPERATIONS
  ├─ Trips          → tabs: Overview · Routes/Legs · Itinerary · Bookings · Expenses · Moments
  ├─ CRM            → tabs: Pipeline · Contacts · Activities
  ├─ Orders         → tabs: Order Info · Items · Payment · Timeline
  ├─ Fulfillment    → tabs: Sourcing · Drop-in Intake
  ├─ Warehouse      → tabs: Inbound/Intake · Stock · Conditions
  ├─ Load Planning  → tabs: Packing Board · Luggage · Simulation
  └─ Delivery       → tabs: Shipments · Tracking · Proof of Delivery

CATALOG
  ├─ Products
  ├─ Brands
  ├─ Categories     → tab: Sub-categories
  └─ Units

FINANCE
  ├─ Receivables
  ├─ Payables
  ├─ Trip Expenses
  └─ Reports

MASTER DATA
  ├─ Geography      → tabs: Continents · Countries
  └─ Luggage Types

SETTINGS
  ├─ Users
  ├─ Roles
  ├─ Permissions
  ├─ Menu
  └─ User Types
```

## Permission key convention

Format `<resource>.<action>`, action: `read` | `write` | `delete` (perhalus
sesuai kebutuhan). Contoh: `trips.read`, `orders.write`, `payables.read`,
`menu.write`.

Tiap menu item punya `required_permission` (nullable). Jika null → tampil untuk
semua authenticated. Jika diisi → hanya tampil bila user punya permission itu.

## Resolusi menu user (frontend)

1. Ambil `profiles.role` user.
2. Ambil permission via `role_permissions` → `permissions`.
3. Query `menus` (is_active), build tree dari `parent_id` + `group`.
4. Filter: tampilkan menu bila `required_permission` null ATAU ada di set
   permission user.
5. Render sidebar dari tree, urut `sort_order`.

## Seed awal (MVP)

- Roles: `admin`, `staff`, `traveler` (+ `customer` bila perlu).
- `admin` → semua permission.
- `staff` → semua kecuali Settings (atur sesuai kebutuhan).
- `traveler` → Fulfillment, Warehouse, Load Planning, Delivery, Trips (read).
- Seed `menus` sesuai hierarki di atas, idempotent (`on conflict do nothing`).
- Seed `permissions` dari daftar resource × action.

> Karena RLS masih LANGKAH 1 (full access), seed permission cukup untuk menyetir
> UI. Penegakan data per-role menyusul di LANGKAH 2.
