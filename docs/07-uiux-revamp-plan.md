# 07 — UI/UX Revamp Plan (working doc)

> **Status: AKTIF.** Ini *peta kerja sementara* hasil review per-menu-group. Tiap fase
> kelar → update docs kanonik (`02-data-model`, `06-as-built`, modul terkait) + centang
> di sini. **Setelah semua fase kelar, file ini DIHAPUS** (info-nya udah dilebur ke docs
> hidup + git history). Docs lama yang masih reference TIDAK dihapus, cuma di-update.

## Prinsip
- **Fondasi reusable dulu.** Banyak koreksi sebenarnya 1 build dipakai banyak tempat
  (master framework, media lightbox, foto, Excel, pola detail-page). Kerjain ini di FASE A
  biar fase berikutnya cepat.
- Tiap fase: migration (kalau ada) → `gen:types` → composable → UI → **e2e tetap hijau** → commit.
- Aturan lama tetap: business rule di DB, no `any`, nilai turunan via view, RLS LANGKAH 1.

## Ringkasan perubahan DB (semua migration yang dibutuhkan)
- **Foto/bukti:** `brands.image_url`, `order_items.image_url` (nullable), `profiles.avatar_url`,
  `payments.proof_url`. *(customers.image_url & products.image_url SUDAH ADA.)*
- **Master baru (5):** `expense_categories`, `lead_sources`, `stores`, `couriers`,
  `payment_methods`. **KEPUTUSAN (user):** *snapshot/beku* — operations tetap simpan **teks**
  nama saat dicatat (kayak fx_rate), master = **daftar pilihan saja**, BUKAN FK. Rename/hapus
  master = **nol efek** ke transaksi lama. Input free-text → `MasterSelect` (USelect dari master,
  pertahankan nilai lama). Kolom text operations TIDAK berubah.
- **Traveler:** `trip_travelers` (trip_id, profile_id) — many-to-many; assign traveler ke trip.
- **Substitusi:** tidak perlu kolom baru (`sourcing_records.is_substitute/substitute_note` udah ada) —
  cuma di-surface ke Order.
- **Invoice:** tabel `invoices` (code `INV-` auto, order_id, issued_at, due_at, status
  `draft|sent|paid|void`, ...), + `company_profile` (single-row: nama, logo_url, alamat,
  rekening/QRIS).
- **(Open) Pajak:** `tax_rates` belum diputuskan — wire ke order/finance atau buang.

---

## FASE A — Fondasi reusable

**A1. UI cleanup global** *(no DB)* — ✅ **SELESAI** (commits 028f899, 5a941a1, 83f6658)
- Rename istilah **`leg`/`legs` → `route`** di SELURUH UI (label, judul, placeholder).
  Tabel tetap `trip_routes`. e2e yang assert teks "leg" disesuaikan.
- **FAB** (floating add) konsisten di Trip detail — Bookings/Expenses/Routes ikut pola
  Itinerary/Moments (bukan tombol stack).
- Polish **tombol-aksi-dalam-tabel** (Warehouse "Terima & timbang", Delivery "Bukti & selesai")
  biar seragam & rapi.

**A2. Media lightbox** *(no DB)* — ✅ **SELESAI**
- Komponen reusable `MediaViewer` — preview foto/video/dll **inline (modal/lightbox)**,
  bukan buka tab baru. Support **multiple media**. Dipakai semua: foto produk/brand/customer/item,
  struk sourcing, bukti delivery, moments.

**A3. Foto end-to-end** *(migration: brands, order_items, profiles, payments)* — ✅ **SELESAI**
- Wire `FileUpload` + thumbnail + MediaViewer ke: **Users** (avatar; via server route + auth
  store + topbar), **Brands**, **Products** (kolom udah ada), **Customers** (kolom udah ada),
  **Order item titipan** (opsional, buat shopper kenalin barang), **Payment proof**.

**A4. Master-data framework + 5 master baru** — ✅ **SELESAI**
- Pola reusable master CRUD. Master: `expense_categories` (Trip expense), `lead_sources` (CRM lead),
  `stores` (Fulfillment sourcing), `couriers` (Fulfillment drop-in + Delivery — 1 master dipakai 2),
  `payment_methods` (Receivables). Ganti input free-text jadi select dari master.
- Tempatkan di grup **Master Data** (menu).

**A5. Pola detail-page** — ✅ **SELESAI** (komponen `DetailHeader`)
- Pola seragam: **header card** (avatar/nama + info kunci + badge) + **tombol primer** kanan-atas,
  destructive dipisah; body = section/tab card putih. Terapkan ke **Customer detail** + **Order detail (Info)**.

**A6. Export/Import Excel** *(reusable, lib `xlsx`/SheetJS)* — ✅ **SELESAI**
> ⚠️ **Follow-up keamanan:** terpasang `xlsx@0.18.5` dari registry npm (ada CVE
> prototype-pollution/ReDoS). Risiko kecil (tool internal, file operator sendiri), tapi
> ganti ke versi CDN resmi `xlsx@0.20.x` (`npm i https://cdn.sheetjs.com/...`) saat network
> mengizinkan. Reusable: `useExcel` + `ExcelToolbar` + util `matchByName/numCell/activeCell`.
> Wired ke **SEMUA master + Catalog**: 5 master A4 (via SimpleMasterCrud), Currencies (key=code),
> Tax Rates (+migration unique name), Luggage Types, Geography (Continents key=code, Countries
> FK continent-by-code + key=iso2), Catalog (Brands, Categories, Units, Sub-categories
> composite-key, **Products** 5-FK-by-name). Reports = export-only.
- Util + komponen export (tabel → `.xlsx`) & import (upload → **validasi** → **upsert** →
  **resolusi FK by-name** → laporan error per-baris). Terapkan ke semua master + **Catalog**
  (Brands, Categories, **Products** = paling berat: 5 FK by-name). **Reports = export-only.**
- Bonus: ini jadi **alat re-seed** untuk FASE F.

---

## FASE B — Traveler assignment *(Trip ⟷ Load Planning)* — ✅ **SELESAI**
- **B1** ✅ `trip_travelers` (trip_id+profile_id+**role** lead/assistant) + tab **Travelers** di Trip detail.
- **B2** ✅ Load Planning pilih **trip + route**; PackingBoard scoped per-route (queue/isi/berat),
  modal lepas picker route; dropdown traveler koper **dibatasi ke traveler trip**.
- **B3** ✅ **Drag-n-drop** (vuedraggable/Sortable.js) — queue → koper, antar koper; tombol tap + x tetap (fallback).
- **B4** ✅ Simulation tampil **nama traveler** + **filter (traveler) & sort (nama/berat/sisa)**.
- **B5** ✅ **Packing qty-aware** — `load_items.qty`; 1 item bisa dipecah ke beberapa koper
  (drag pindah semua + stepper −/+); status `packed` cuma saat semua unit ter-place; berat/volume
  kartu & simulasi pakai qty; kartu queue tampil berat·p×l×t·volume.

## FASE C — Order & Fulfillment
- Produk dipilih di item order → **harga auto-fill** (dari `products.price`, editable);
  **berat/dimensi disembunyiin** (pakai data produk) — field manual cuma untuk item free-text.
- **Label berat diperjelas**: "Berat / unit" + tampil total (unit × qty).
- **Substitusi** di-surface ke Order: badge "diganti" + catatan substitusi pada item.
- (Foto item titipan → sudah di A3.)

## FASE D — Finance: Invoice & pembayaran
- **Company Profile** (single settings: nama usaha, logo, alamat, rekening/QRIS).
- **Invoices persisted** (`INV-` auto, link order, terbit/jatuh-tempo, status) + **generate PDF**.
- **Bukti pembayaran** upload di catat-bayar (→ payments.proof_url, A3).
- Alur: Order → terbitkan invoice → kirim → catat bayar + bukti → AR/invoice lunas.

## FASE E — Dashboard
- **Work queues** actionable ("X order siap packing → klik langsung kerja").
- **Filter periode** (bulan ini / range tanggal) untuk kas & profit.
- **Notifikasi** dari data (bel: AR jatuh tempo, koper over-weight, dll).

## FASE F — Wipe + re-seed master *(FASE 14 lama)*
- Kosongkan semua **kecuali** user/roles/permissions/menu. Re-seed master pakai **Excel import**
  (FASE A6) dari data asli user. Destruktif → konfirmasi eksplisit sebelum eksekusi.

---

## Polish kecil tersebar
- Trip **Overview** dipercantik.
- CRM **Pipeline**: tiap kolom status dikasih border (kelihatan walau kosong).
- Delivery **Tracking**: visual lebih kanban/pipeline.

## Keputusan open
- **Tax Rates**: wire ke Order/Finance (pajak per order/item) **atau** buang (YAGNI sampai butuh).
- (Follow-up lama, di luar revamp ini: **RLS LANGKAH 2** keamanan data per-row, rotasi PAT.)

## Inventory komponen/pola reusable (dibuat sekali, dipakai banyak)
| Reusable | Dibuat di | Dipakai |
|---|---|---|
| `MediaViewer` (lightbox) | A2 | semua foto/video/struk/bukti/moments |
| Master CRUD pattern | A4 | 5 master baru + master lama |
| Export/Import Excel | A6 | semua master + Catalog + Reports(export) |
| Pola detail-page | A5 | Customer detail, Order detail |
| Foto wiring (FileUpload+thumb+viewer) | A3 | user/brand/product/customer/item/payment |
| `couriers` master | A4 | Fulfillment drop-in + Delivery |
