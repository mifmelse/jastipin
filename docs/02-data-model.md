# Data Model

> **Deskripsi tabel & field — Claude Code yang menulis SQL `CREATE TABLE`.**
> Ikuti konvensi di `01-architecture.md` (uuid PK, snake_case plural, timestamptz,
> status = text+check, money = numeric, weight = gram, dimensi = mm).
> Tabel yang **sudah ada**: `continents`, `countries`, `profiles`.

> ⚠️ **SUDAH DIBANGUN.** Dokumen ini = niat desain awal. Untuk realita final
> (view sebagai sumber nilai turunan, multi-currency, payables = VIEW union, dst.)
> lihat **`06-as-built.md`** — itu yang berlaku bila berbeda. Catatan `→ as-built`
> ditandai di bawah pada bagian yang menyimpang.

## ERD ringkas (relasi utama)

```
continents 1──< countries
countries  ──< trip_routes (from/to)   ──< orders ──< order_items
                                                          │
profiles (auth/role)                                      │
                                                          ▼
trips 1──< trip_routes                            products ──< (brand/category/sub/unit/country)
trips 1──< trip_bookings                                  
trips 1──< trip_expenses                          luggage_types 1──< luggages
trips 1──< trip_moments                           trips 1──< luggages
                                                  luggages 1──< load_items >── order_items
customers 1──< customer_addresses
customers 1──< orders
customers 1──< crm_pipeline / crm_activities

orders 1──< payments            (receivable)
order_items 1──1 sourcing_records   (fulfillment_type=sourcing)
order_items 1──1 drop_in_intakes    (fulfillment_type=drop_in)
orders/order_items ──< warehouse_items
order_items ──< shipments (delivery)
trips/orders ──< payables       (payable)
sourcing_records.actual_total ──> payables (kategori sourcing)
```

---

## A. RBAC & Menu  (lihat detail di `03-menu-rbac.md`)

- **roles** — id, name (unique), description.
- **permissions** — id, key (unique, mis. `trips.read`, `orders.write`), description.
- **role_permissions** — role_id, permission_id (composite unique).
- **menus** — id, parent_id (nullable, self-ref), label, icon, route/path,
  `group` (text: Operations/Catalog/Finance/Master Data/Settings), sort_order,
  required_permission (nullable → key di permissions), is_active.
- **profiles** *(ada)* — tambah role `traveler` ke check bila dipakai.

> Menu dynamic: sidebar dibangun dari `menus`, difilter oleh permission user.

---

## B. Master Data

### geography *(sudah ada)*
- **continents**: code (unique), name.
- **countries**: continent_id→continents, iso2/iso3 (unique), name, dial_code.

### luggage_types  *(BARU — master)*
Definisi jenis wadah angkut.
- id, name (mis. "Koper Bagasi 28in", "Kabin 20in", "Backpack", "Totebag")
- category: `checked` | `cabin` | `personal`
- max_weight_g (numeric, gram) — batas berat muat
- tare_weight_g (numeric, gram) — berat kosong
- max_volume_cm3 (numeric, nullable) — kapasitas volume
- inner_length_mm / inner_width_mm / inner_height_mm (nullable) — dimensi dalam
- regulation_note (text, nullable) — mis. "kabin max 7kg maskapai X"
- is_active

### Picker masters *(BARU — A4)*
Lima master "daftar pilihan" seragam: `id, name (unique), is_active, created_at`.
- **expense_categories** — kategori Trip expense
- **lead_sources** — asal lead CRM
- **stores** — toko sourcing (Fulfillment)
- **couriers** — kurir; dipakai 2 tempat (drop-in `courier_from` + delivery `courier`)
- **payment_methods** — metode bayar (Receivables)

**Penting — snapshot, BUKAN FK:** operations menyimpan **teks** nama yang dipilih saat
dicatat (beku, seperti fx_rate). Master cuma daftar pilihan; rename/hapus master **nol efek**
ke transaksi lama. UI pakai komponen `MasterSelect` (USelect dari master, nilai lama tetap
tampil). Kolom operations terkait tetap text: `trip_expenses.category`, `leads.source`,
`sourcing_records.store_name` & `courier_from`, `deliveries.courier`, `payments.method`.

---

## C. Catalog

### products
- id, code (unique, opsional), name, description
- brand_id → brands (nullable)
- category_id → categories
- sub_category_id → sub_categories (nullable)
- unit_id → units
- country_id → countries (origin barang)
- **weight_g** (numeric, gram) — WAJIB untuk packing
- **length_mm / width_mm / height_mm** (numeric, nullable) — untuk volume
- base_price (numeric, currency) — harga acuan jual (opsional bila per-order)
- cost_price (numeric, nullable) — modal acuan
- currency (text, default 'IDR')
- image_url (text, nullable) — Supabase Storage
- is_active, created_at, updated_at

### brands
- id, name (unique), country_id (nullable), image_url (nullable, logo), is_active.

### categories
- id, name (unique), description, is_active.

### sub_categories
- id, category_id → categories, name, is_active.
- (Tampil sebagai tab di halaman Categories.)

### units
- id, name (mis. "pcs", "box", "pair"), symbol (nullable), is_active.

---

## D. Operations

### trips
- id, code (unique, `TRP-xxxx`), name (`trip_name`)
- type: `single` | `round` | `multi`   (`trip_type`)
- traveler_count (int)
- total_capacity_kg (numeric) — agregat acuan; kapasitas riil dihitung dari luggages
- status: `draft` | `planned` | `ongoing` | `completed` | `cancelled`
- created_by → profiles (nullable), created_at, updated_at
- *(itinerary detail bisa di trips atau tabel terpisah `trip_itineraries` —
  lihat module trip; MVP boleh kolom JSON/teks dulu.)*

### trip_routes  (LEG)
- id, trip_id → trips (cascade)
- from_country_id → countries
- to_country_id → countries
- departure_date (date)
- sequence (int) — urutan leg dalam trip
- *(arah leg = from→to menentukan asal & tujuan barang)*

### trip_travelers *(BARU — B1)*
Siapa yang fisik ikut & bawa barang di trip (many-to-many trip↔user).
- id, trip_id → trips (cascade), profile_id → profiles (cascade)
- role: `lead` | `assistant`
- unique (trip_id, profile_id)
- *Load Planning baca ini: dropdown traveler koper dibatasi ke set ini; Simulation tampil namanya.*

### trip_bookings
Booking terkait trip (tiket, hotel, transport).
- id, trip_id → trips, type (text: flight/hotel/transport/other),
  title, reference_no (nullable), date (nullable), amount (numeric, nullable),
  currency, notes.

### trip_expenses
Biaya operasional trip (transport, makan, dll) → feed ke Finance Payable.
- id, trip_id → trips, category (text), description, amount (numeric),
  currency, spent_at (date), receipt_url (nullable), created_by → profiles.

### trip_moments
Dokumentasi/kenangan (future-friendly).
- id, trip_id → trips, caption (nullable), media_url, created_at.

### customers
- id, name, phone, email (nullable), gender (nullable),
  country_id → countries (nullable), image_url (nullable),
  notes (nullable), created_at, updated_at.

### customer_addresses
- id, customer_id → customers (cascade), label, recipient_name, recipient_phone,
  address_line, city, postal_code, country_id → countries, notes (nullable).

### orders  (HEADER — per customer per leg)
- id, code (unique, `ORD-xxxx`)
- customer_id → customers
- trip_route_id → trip_routes   (**order menempel ke LEG**)
- shipping_address_id → customer_addresses (nullable)
- status: `draft` | `confirmed` | `paid` | `fulfilling` | `packed` |
          `in_transit` | `delivered` | `completed` | `cancelled` | `refunded`
- fee, shipping_cost (numeric, input), currency, **fx_rate** (kurs beku → IDR)
- notes, created_by → profiles, created_at, updated_at
- → **as-built:** subtotal & total **TIDAK** jadi kolom — view `order_summaries`
  menghitung subtotal (Σ item) + total + total_idr.

### order_items
- id, order_id → orders (cascade)
- product_id → products (nullable — bisa free-text untuk drop-in non-katalog)
- item_name (text — wajib bila product_id null; titipan pribadi)
- fulfillment_type: `sourcing` | `drop_in`
- qty (int), unit_id → units (nullable)
- requested_price / actual_price (numeric, nullable), currency
- weight_g (numeric, nullable — override product, atau isi untuk drop-in)
- length_mm/width_mm/height_mm (nullable)
- status: `pending` | `sourcing` | `purchased` | `received` | `out_of_stock` |
          `in_warehouse` | `packed` | `delivered` | `cancelled`
- notes
- *(carry-over antar leg: lihat `04-modules/03-order.md` — kemungkinan butuh
  kolom/relasi tambahan `current_leg` atau tabel `order_item_legs`.)*

### CRM
- **crm_pipeline** — id, customer_id → customers (nullable saat masih lead),
  contact_name, contact_phone, source (text: ig/wa/referral/...),
  stage: `reach` | `lead` | `conversation` | `order` | `repeat`,
  trip_id → trips (nullable, lead untuk trip mana), value_estimate (nullable),
  owner → profiles (nullable), created_at, updated_at.
- **crm_activities** — id, pipeline_id → crm_pipeline (cascade),
  type (text: note/call/message/follow_up), content, created_by → profiles,
  created_at.

### Fulfillment  *(tabel terpisah — TERKUNCI, bukan opsional)*
`order_items` simpan transaksi (`fulfillment_type`, `status`); detail proses
fisik belanja/terima ada di tabel sendiri agar order_items tetap bersih.

- **sourcing_records** — detail belanja shopper (1 per order_item sourcing).
  - id, order_item_id → order_items (unique)
  - shopper_id → profiles (siapa yang belanja)
  - store_name (text, nullable) — toko tempat beli
  - purchased_at (timestamptz, nullable)
  - actual_price (numeric) — harga aktual di mata uang asal
  - currency (text, mis. 'JPY') + fx_rate (numeric) — kurs saat beli
  - actual_total (numeric) — actual_price × qty × fx_rate (→ Finance Payable)
  - is_substitute (bool, default false) + substitute_note (text, nullable)
  - receipt_url (text, nullable) — struk/nota (Supabase Storage)
  - note (text, nullable)
  - status mirror item: `pending | sourcing | purchased | out_of_stock`

- **drop_in_intakes** — barang dikirim customer sendiri (1 per order_item drop_in).
  - id, order_item_id → order_items (unique)
  - received_at (timestamptz), received_by → profiles
  - courier_from (text, nullable) — kurir asal customer
  - condition: `good` | `damaged`
  - condition_note (text, nullable), photo_url (text, nullable)

> Constraint: tipe record harus cocok `order_items.fulfillment_type`
> (sourcing_records hanya untuk item sourcing; drop_in_intakes hanya untuk drop_in).

### Warehouse
- **warehouse_items** — id, order_item_id → order_items (unique),
  location (text/rak, nullable), condition: `good` | `damaged` | `missing`,
  intake_at, intake_by → profiles, weighed_g (numeric, nullable — berat aktual),
  measured dims (nullable), notes.
- (Stok = view/agregasi dari warehouse_items yang belum packed.)

### Load Planning
- **luggages** — instance luggage untuk satu trip.
  id, trip_id → trips, luggage_type_id → luggage_types,
  assigned_traveler → profiles (nullable), label (mis. "Koper A"),
  status: `planned` | `packed` | `loaded` | `unloaded`.
- **load_items** — unit barang dimuat ke luggage (boleh acak lintas customer).
  id, luggage_id → luggages (cascade), order_item_id → order_items,
  trip_route_id → trip_routes (leg mana barang ini dibawa — penting untuk
  carry-over), **qty (int, B5)** — jumlah unit di luggage ini, placed_at, placed_by → profiles.
  - **unique (luggage_id, order_item_id, trip_route_id)** — 1 order_item bisa **dipecah**
    ke beberapa luggage (B5); dalam 1 luggage+leg cukup qty-nya yang berubah.
  - **Status (trigger):** order_item → `packed` hanya saat **semua unit** ter-place di leg-nya
    (Σ load_items.qty ≥ order_items.qty), selain itu balik `in_warehouse`.
  - Simulasi: berat per luggage = Σ (per-unit weight × **load_items.qty**) + tare ≤ max; volume serupa.

### Delivery
- **shipments** — id, order_id → orders (atau granular per order_item bila perlu),
  trip_route_id → trip_routes (leg pengantaran), courier (text, nullable),
  tracking_no (nullable), status: `pending` | `in_transit` | `delivered` |
  `failed`, shipped_at, delivered_at, proof_url (nullable), recipient_signed (bool).

---

## E. Finance

### payments  (RECEIVABLE — uang masuk customer)
- id, order_id → orders, amount (numeric), currency, **fx_rate**, method (text),
  paid_at, status: `pending` | `paid` | `refunded`, reference (nullable),
  recorded_by → profiles.
- → **as-built:** piutang per order dihitung view `ar_per_order`
  (total tagihan − Σ pembayaran paid = outstanding).

### payables  (PAYABLE — modal keluar)
> → **as-built (PENTING — beda dari spec):** `payables` BUKAN tabel, tapi **VIEW
> union** yang menyatukan sumber biaya secara **live** (anti double-count by design):
> - `sourcing` ← `sourcing_summaries.actual_total`
> - `shipping` ← `orders.shipping_cost × fx_rate`
> - `trip_expense` ← `trip_expenses.amount × fx_rate`
> - `other` ← tabel **`manual_payables`** (satu-satunya payable yang disimpan)
>
> Kolom view: source_type, source_id, trip_id, amount_idr, currency, amount_src,
> incurred_at, description, status, paid_at. Status bayar disimpan di overlay tipis
> **`payable_settlements`** (unique per source_type+source_id; ada baris = paid).
> Nilai tidak pernah disalin/basi; reports baca view → tidak mungkin double-count.

### invoices *(BARU — D2)*
Tagihan persisted per order (totals tetap derived; record cuma simpan kode/tanggal/status).
- id, **code** (`INV-xxxx` auto via `set_code`), order_id → orders (cascade),
  issued_at (date), due_at (date, nullable), status: `draft|sent|paid|void`, notes.
- Print page `/finance/invoices/[id]` (layout `print` + `@media print`) → **Save as PDF**.

### company_profile *(BARU — D1)*
Single-row (`id = 1`) identitas usaha untuk header/footer invoice.
- name, logo_url, address, phone, email, bank_name, bank_account, bank_holder,
  qris_url, invoice_note. Menu di **Settings** (admin-only).

### Reports
Tidak butuh tabel — query/aggregation di atas payments + payables + orders
(profit per order/trip/leg, cashflow, dll).

---

## Catatan implementasi status

- Semua kolom `status` = `text` + `check (status in (...))` sesuai daftar di atas.
- Transisi status diatur di logic aplikasi/composable (state machine), bukan DB.
- Pertimbangkan tabel `*_status_history` hanya bila audit trail diperlukan
  (YAGNI — jangan di MVP kecuali diminta).
