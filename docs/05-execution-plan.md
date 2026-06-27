# Execution Plan

Urutan build untuk Claude Code. Bangun **berlapis dari fondasi**. Jangan loncat —
modul atas menyediakan FK/relasi untuk modul bawah. Setelah tiap fase migrasi
DB: jalankan `npm run gen:types`.

> **STATUS: SELESAI (12/12 fase).** Seluruh alur CRM→Order→Fulfillment→Warehouse→
> Load Planning→Delivery→Finance jalan end-to-end, diverifikasi 38 test Playwright
> (prod build). Ringkasan as-built + inventory view/trigger + deviasi dari spec ada
> di **`06-as-built.md`**. Checklist di bawah ditandai apa adanya, dengan catatan `→`
> di tiap deviasi penting.

## Prinsip eksekusi
> Aturan kerja & konvensi AI (YAGNI, RLS LANGKAH 1, alur `migration → npm run gen:types
> → composable → page/tabs → form`, no `any`, `@nuxt/ui 3`, Pinia, git discipline) ada
> di **`CLAUDE.md`** di root repo. Status & relasi tiap entitas tetap ikut
> `02-data-model.md` persis.

## FASE 0 — Fondasi (sebagian sudah ada)
- [x] Supabase setup, profiles + trigger (`handle_new_user`), geography seed.
- [x] `profiles.role` check (admin/staff/traveler) — tersedia, dipakai di assign.
- [x] Layout admin: sidebar dinamis + topbar responsif (drawer mobile), middleware `auth`.

## FASE 1 — RBAC & Dynamic Menu  (`03-menu-rbac.md`)
- [x] Tabel: roles, permissions, role_permissions, menus.
- [x] Seed roles, permissions (resource.action), menus (hierarki final).
- [x] Composable resolusi menu user → render sidebar dynamic.
- [x] Settings pages: Users, Roles, Permissions, Menu, User Types.
> Fondasi navigasi — semua modul lain butuh ini untuk muncul di sidebar.

## FASE 2 — Master Data  (`04-modules/10-master-settings.md`)
- [x] Geography pages (Continents, Countries).
- [x] luggage_types: migration + page CRUD.
- [x] → **TAMBAHAN:** masters `currencies` + `tax_rates` (multi-currency, lihat 06-as-built).

## FASE 3 — Catalog  (`04-modules/04-product.md`)
- [x] Tabel: brands, categories, sub_categories, units, products.
- [x] Pages: Products, Brands, Categories(+Sub tab), Units.
- [x] Product form lengkap dengan weight_g & dimensi; kode produk auto (`PRD-`).

## FASE 4 — Trip  (`04-modules/01-trip.md`)
- [x] Tabel: trips, trip_routes, trip_bookings, trip_expenses, trip_moments.
- [x] Trip page + tabs (Overview, Routes/Legs, Itinerary, Bookings, Expenses, Moments).
- [x] Logic trip_type single/round/multi + auto-chain leg + trigger reset rute saat ganti tipe.
- [x] → Itinerary jadi **terstruktur per-tanggal** (tabel `trip_itineraries`), bukan free-text.
- [x] → Moments jadi **timeline sosmed** (`trip_moments` + `trip_moment_media`, RPC `create_moment`).
- [x] → Upload file (resi/foto) via Supabase Storage bucket `media`.

## FASE 5 — CRM & Customers  (`04-modules/02-crm.md`)
- [x] Tabel: customers, customer_addresses, crm_pipeline, crm_activities.
- [x] CRM page + tabs (Pipeline, Contacts, Activities).
- [x] Customer CRUD + addresses. Lead either/or (kontak baru **atau** customer).

## FASE 6 — Order  (`04-modules/03-order.md`)
- [x] Tabel: orders, order_items. Kode order auto (`ORD-`).
- [x] Order page + tabs (Order Info, Items). Order terikat trip_route (leg).
- [x] Item form: product/free-text, fulfillment_type, qty, harga, berat/dimensi.
- [x] → subtotal/total **tidak disimpan** — view `order_summaries` (per-order currency + fx → IDR).
- [x] → Handoff CRM lead stage `order` → tombol "Buat order" (prefill customer + leg).

## FASE 7 — Fulfillment  (`04-modules/05-fulfillment.md`)
- [x] Tabel: sourcing_records, drop_in_intakes.
- [x] Constraint tipe record cocok `fulfillment_type` (trigger `assert_item_fulfillment_type`).
- [x] Fulfillment page: Sourcing workspace + Drop-in Intake.
- [x] → `actual_total` via view `sourcing_summaries` (bukan kolom) → feed Payables.
- [x] → Status item di-mirror dari proses (trigger forward-only).

## FASE 8 — Warehouse  (`04-modules/06-warehouse.md`)
- [x] Tabel: warehouse_items. Timbang aktual (`weighed_g`) menang atas estimasi.
- [x] → Page **2 tab** (Intake + Stock), bukan 3. Conditions digabung ke Stock (filter kondisi).
- [x] → Intake → status item `in_warehouse` (trigger forward-only). Tidak ada delete stok.

## FASE 9 — Load Planning  (`04-modules/07-load-planning.md`)
- [x] Tabel: luggages, load_items.
- [x] Packing Board (klik-assign) + Luggage CRUD + Simulation (view `luggage_simulation`).
- [x] → Berat = per-unit × qty (timbang aktual menang). Carry-over via `load_items.trip_route_id`.
- [x] → Pack→`packed`, unpack item terakhir→`in_warehouse` (trigger).

## FASE 10 — Delivery  (`04-modules/08-delivery.md`)
- [x] Tabel: shipments (per-order, terikat leg).
- [x] Delivery page + tabs (Shipments, Tracking, Proof of Delivery).
- [x] → Shipment `delivered` → item + order ikut `delivered` (trigger); auto-stamp tanggal.

## FASE 11 — Finance  (`04-modules/09-finance.md`)
- [x] Tabel: payments (receivable), manual_payables, payable_settlements.
- [x] Pages: Receivables, Payables, Trip Expenses, Reports.
- [x] → **Anti double-count via DESAIN:** `payables` adalah **VIEW union** (sourcing + ongkir +
      trip_expense + manual), nilai selalu live dari sumber. Status bayar = overlay
      `payable_settlements`. Bukan tabel ledger yang menyalin nilai.
- [x] → View tambahan: `ar_per_order` (piutang per order), `trip_pnl` (profit per trip).

## FASE 12 — Dashboard & polish
- [x] Dashboard ringkas: KPI (trip aktif, order berjalan, kas bersih, AR, AP) +
      breakdown order per status + trip aktif + profit per trip.
- [x] Empty state, validasi form (required + disabled save), status via dropdown — konsisten.

## Definition of done per modul
- Migration jalan tanpa error, RLS aktif (LANGKAH 1).
- Types ter-generate.
- CRUD berfungsi via UI.
- Status & relasi sesuai `02-data-model.md`.
- Handoff antar modul terhubung (lihat tiap file modul).
