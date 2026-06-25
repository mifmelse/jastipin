# Execution Plan

Urutan build untuk Claude Code. Bangun **berlapis dari fondasi**. Jangan loncat —
modul atas menyediakan FK/relasi untuk modul bawah. Setelah tiap fase migrasi
DB: jalankan `npm run gen:types`.

## Prinsip eksekusi
> Aturan kerja & konvensi AI (YAGNI, RLS LANGKAH 1, alur `migration → npm run gen:types
> → composable → page/tabs → form`, no `any`, `@nuxt/ui 3`, Pinia, git discipline) ada
> di **`CLAUDE.md`** di root repo. Status & relasi tiap entitas tetap ikut
> `02-data-model.md` persis.

## FASE 0 — Fondasi (sebagian sudah ada)
- [x] Supabase setup, profiles + trigger, geography seed.
- [ ] Tambah role `traveler` ke `profiles.role` check (bila dipakai).
- [ ] Layout admin: sidebar + topbar, middleware `auth`.

## FASE 1 — RBAC & Dynamic Menu  (`03-menu-rbac.md`)
- [ ] Tabel: roles, permissions, role_permissions, menus.
- [ ] Seed roles, permissions (resource.action), menus (hierarki final).
- [ ] Composable resolusi menu user → render sidebar dynamic.
- [ ] Settings pages: Users, Roles, Permissions, Menu, User Types.
> Fondasi navigasi — semua modul lain butuh ini untuk muncul di sidebar.

## FASE 2 — Master Data  (`04-modules/10-master-settings.md`)
- [ ] Geography pages (Continents, Countries) — data sudah ada, tinggal UI.
- [ ] luggage_types: migration + page CRUD.

## FASE 3 — Catalog  (`04-modules/04-product.md`)
- [ ] Tabel: brands, categories, sub_categories, units, products.
- [ ] Pages: Products, Brands, Categories(+Sub tab), Units.
- [ ] Product form lengkap dengan weight_g & dimensi (WAJIB).

## FASE 4 — Trip  (`04-modules/01-trip.md`)
- [ ] Tabel: trips, trip_routes, trip_bookings, trip_expenses, trip_moments.
- [ ] Trip page + tabs (Overview, Routes/Legs, Itinerary, Bookings, Expenses, Moments).
- [ ] Logic trip_type single/round/multi + auto-chain leg.

## FASE 5 — CRM & Customers  (`04-modules/02-crm.md`)
- [ ] Tabel: customers, customer_addresses, crm_pipeline, crm_activities.
- [ ] CRM page + tabs (Pipeline, Contacts, Activities).
- [ ] Customer CRUD + addresses.

## FASE 6 — Order  (`04-modules/03-order.md`)
- [ ] Tabel: orders, order_items.
- [ ] Order page + tabs. Order terikat trip_route (leg).
- [ ] Item form: product/free-text, fulfillment_type, qty, harga, berat/dimensi.

## FASE 7 — Fulfillment  (`04-modules/05-fulfillment.md`)
- [ ] Tabel: sourcing_records, drop_in_intakes (TERKUNCI — wajib).
- [ ] Constraint: tipe record cocok dengan order_items.fulfillment_type.
- [ ] Fulfillment page: Sourcing workspace (shopper) + Drop-in Intake.
- [ ] sourcing_records.actual_total → feed Finance Payable (FASE 11).

## FASE 8 — Warehouse  (`04-modules/06-warehouse.md`)
- [ ] Tabel: warehouse_items.
- [ ] Warehouse page + tabs (Intake, Stock, Conditions). Timbang aktual.

## FASE 9 — Load Planning  (`04-modules/07-load-planning.md`)
- [ ] Tabel: luggages, load_items.
- [ ] Packing Board + Luggage + Simulation (berat/volume, carry-over per leg).

## FASE 10 — Delivery  (`04-modules/08-delivery.md`)
- [ ] Tabel: shipments.
- [ ] Delivery page + tabs (Shipments, Tracking, Proof of Delivery).

## FASE 11 — Finance  (`04-modules/09-finance.md`)
- [ ] Tabel: payments, payables.
- [ ] Pages: Receivables, Payables, Trip Expenses, Reports.
- [ ] Pastikan anti double-count (payables = ledger tunggal).

## FASE 12 — Dashboard & polish
- [ ] Dashboard ringkas (trip aktif, order pending, cashflow, kapasitas).
- [ ] Review status transitions, empty states, validasi.

## Definition of done per modul
- Migration jalan tanpa error, RLS aktif (LANGKAH 1).
- Types ter-generate.
- CRUD berfungsi via UI.
- Status & relasi sesuai `02-data-model.md`.
- Handoff antar modul terhubung (lihat tiap file modul).
