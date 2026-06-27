# As-Built — apa yang benar-benar dibangun

Dokumen ini merekam **realita implementasi** Jastipin setelah 12 fase selesai:
inventory skema, keputusan arsitektur, dan **deviasi dari spec awal** (`02-data-model.md`,
`04-modules/*`). Spec lama tetap berguna sebagai niat desain; di mana berbeda, **dokumen
ini yang berlaku**.

Status: **12/12 fase selesai**, diverifikasi 38 test Playwright (dijalankan terhadap
**production build**, bukan dev server). Semua RLS = LANGKAH 1 (`authenticated full access`).

---

## 1. Keputusan arsitektur kunci (lintas modul)

1. **Nilai turunan TIDAK disimpan — dihitung via VIEW.** subtotal/total order, modal
   sourcing, berat luggage, payable, piutang, profit: semua view, bukan kolom.
   (Sesuai aturan CLAUDE.md "jangan simpan nilai turunan".)
2. **Multi-currency.** Master `currencies` + `tax_rates`. Transaksi menyimpan
   `currency` + `fx_rate` (kurs **dibekukan** saat transaksi). IDR = amount × fx_rate,
   dihitung saat baca. Dipakai di: orders, payments, sourcing_records, trip_expenses,
   trip_bookings, manual_payables.
3. **Status digerakkan proses, via trigger forward-only.** Status `order_items`
   tidak diedit manual di tiap modul — ia **di-mirror** dari proses hilir (fulfillment,
   warehouse, load planning, delivery). "Forward-only" = tidak pernah menarik mundur
   item yang sudah maju.
4. **Aturan bisnis hidup di DB** — constraint + trigger + view, bukan di komponen Vue.
5. **Kode entitas auto** via trigger `set_code(prefix, sequence)`: `PRD-`, `TRP-`, `ORD-`.

---

## 2. Inventory skema

### Tabel (38)
RBAC/master: `profiles, roles, permissions, role_permissions, menus, user_types,
continents, countries, luggage_types, currencies, tax_rates`.
Catalog: `brands, categories, sub_categories, units, products`.
Trip: `trips, trip_routes, trip_bookings, trip_expenses, trip_itineraries,
trip_moments, trip_moment_media`.
CRM: `customers, customer_addresses, crm_pipeline, crm_activities`.
Order→Delivery: `orders, order_items, sourcing_records, drop_in_intakes,
warehouse_items, luggages, load_items, shipments`.
Finance: `payments, manual_payables, payable_settlements`.

### View (6) — semua sumber kebenaran nilai turunan
| View | Isi |
|---|---|
| `order_summaries` | order + subtotal/total/total_idr (Σ item × harga), item_count |
| `sourcing_summaries` | sourcing_record + `actual_total` (actual_price × qty × fx) |
| `luggage_simulation` | per luggage: berat (per-unit × qty, timbang aktual menang) + volume + tare |
| `payables` | UNION ledger: sourcing + ongkir order + trip_expense + manual; status dari overlay |
| `ar_per_order` | per order: total tagihan vs terbayar → outstanding |
| `trip_pnl` | per trip: revenue (order) − cost (payables) = profit |

### Trigger / function (13)
`handle_new_user` (auth→profiles) · `set_code` · `set_updated_at` ·
`reset_routes_on_type_change` (ganti tipe trip → hapus leg) ·
`create_moment` (RPC timeline + media transaksional) ·
`assert_item_fulfillment_type` (constraint tipe record = fulfillment_type) ·
`mirror_sourcing_status` / `mirror_dropin_status` / `mirror_warehouse_status` /
`mirror_load_status` + `unmirror_load_status` / `mirror_shipment_delivered`
(status item digerakkan proses) · `shipment_stamp` (auto shipped_at/delivered_at).

---

## 3. Deviasi dari spec awal

| Area | Spec awal | As-built | Alasan |
|---|---|---|---|
| Order total | kolom subtotal/total | view `order_summaries` | jangan simpan turunan |
| Itinerary | "MVP boleh teks/JSON" | tabel `trip_itineraries` per-tanggal | input terstruktur |
| Moments | media_url + caption | timeline (`trip_moments` + `trip_moment_media`) | konsep sosmed |
| Warehouse tab | Intake / Stock / Conditions (3) | Intake / Stock (2) | Conditions = filter di Stock (DRY) |
| Fulfillment `actual_total` | kolom | view `sourcing_summaries` | jangan simpan turunan |
| **Payables** | tabel ledger (nilai disalin) | **VIEW union** + overlay `payable_settlements` | anti double-count by design, nilai live |
| Shipment granular | "per order atau per item" | per-order | cukup untuk MVP |
| Multi-currency | belum eksplisit | masters + fx_rate dibekukan | kebutuhan jastip lintas negara |

---

## 4. Struktur UI (pages & tabs)

- **Dashboard** (`/`) — KPI (trip aktif, order berjalan, kas bersih, AR, AP) +
  breakdown order per status + trip aktif + profit per trip.
- **Operations:** Trips (Overview/Routes/Itinerary/Bookings/Expenses/Moments) ·
  CRM (Pipeline/Contacts/Activities) · Orders (list + detail: Order Info/Items) ·
  Fulfillment (Sourcing/Drop-in) · Warehouse (Intake/Stock) ·
  Load Planning (Packing Board/Luggage/Simulation, per trip) ·
  Delivery (Shipments/Tracking/Proof of Delivery).
- **Catalog:** Products, Brands, Categories(+Sub), Units.
- **Finance:** Receivables, Payables, Trip Expenses, Reports.
- **Master Data:** Geography, Luggage Types, Currencies, Tax Rates.
- **Settings:** Users, Roles, Permissions, Menu, User Types.

---

## 5. Alur status `order_items` (end-to-end)

```
pending → (sourcing: sourcing/purchased | drop_in: received)   [Fulfillment]
        → in_warehouse                                          [Warehouse intake]
        → packed                                                [Load Planning]
        → delivered                                             [Delivery]
(+ out_of_stock, cancelled)
```
Tiap transisi digerakkan trigger dari modul terkait, forward-only.

---

## 6. Verifikasi

E2E Playwright (`e2e/*.spec.ts`) terhadap **prod build** (port 3100), service_role
untuk setup/teardown. Cakupan: CRUD master/catalog, semua tombol & select, trip
type rules, CRM, order + derived totals, fulfillment type-match + status mirror,
warehouse intake→stock, load planning pack/simulation, delivery cascade, finance
(receivable, payable ledger, anti double-count, P&L), dashboard.
