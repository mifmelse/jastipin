# 11 — Import / Export Excel

Semua master & catalog punya tombol **Export** / **Import** (komponen `ExcelToolbar`).
Tujuan utama: **re-seed cepat** (lihat FASE F) + edit massal di Excel/Sheets.

## Alur (jangan menebak kolom)
1. Klik **Export** → turun `.xlsx` berisi **kolom yang benar + data yang ada**. File ini
   sekaligus jadi **template**.
2. Kalau tabel **masih kosong**, Export tetap mengeluarkan **template kolom kosong**
   (header + 1 baris kosong) — jadi kolomnya selalu ketahuan.
3. Edit di Excel/Sheets → **Import** file itu kembali.

## Aturan isi
- **Baris 1 = header** (nama kolom harus persis). Baris 2 dst = data.
- **FK diisi NAMA, bukan id.** Saat import, nama dicocokkan ke master terkait
  (case-insensitive). Nama tak ketemu → baris itu **error**, baris lain tetap jalan.
- **Update vs baru (upsert idempotent):** bila nilai *key* sudah ada → **update**;
  belum ada → **baru**. Re-import aman, tidak menggandakan.
- **Laporan per-baris:** setelah import muncul modal `X baru · Y update · Z error`
  dengan **nomor baris** tiap error. Reports = **export-only** (tak ada import).

> Catatan: master picker (`source`, `store`, `courier`, `payment method`) menyimpan
> **teks snapshot** di transaksi (lihat `02-data-model`), jadi kolomnya teks bebas —
> import master ini hanya mengatur daftar pilihannya.

## Referensi kolom per resource

| Resource | Key upsert | Kolom (wajib **tebal**) |
|---|---|---|
| Expense Categories / Lead Sources / Stores / Couriers / Payment Methods | `name` | **name**, is_active |
| Currencies | `code` | **code**, **name**, symbol, is_active |
| Tax Rates | `name` | **name**, **rate**, is_active |
| Luggage Types | `name` | **name**, **category** (`checked`/`cabin`/`personal`), **max_weight_g**, tare_weight_g, max_volume_cm3, inner_length_mm, inner_width_mm, inner_height_mm, regulation_note, is_active |
| Continents | `code` | **code**, **name** |
| Countries | `iso2` | **continent** (kode/nama), **iso2**, **iso3**, **name**, dial_code |
| Brands | `name` | **name**, country (nama), is_active |
| Categories | `name` | **name**, description, is_active |
| Sub-categories | `(category, name)` | **category** (nama), **name**, is_active |
| Products | *insert* | **name**, **category** (nama), **unit** (nama), **weight_g**, brand, sub_category, country, code, length_mm, width_mm, height_mm, base_price, cost_price, currency, is_active |

> Products = **insert** (tiap baris bikin produk baru; `code` di-generate sistem),
> dengan **5 FK by-name**: brand, category, sub_category, unit, country.

## Contoh isi

`expense-categories.xlsx`

| name | is_active |
|---|---|
| Makan | TRUE |
| Transport | TRUE |

`products.xlsx`

| name | brand | category | unit | country | weight_g | base_price |
|---|---|---|---|---|---|---|
| Hada Labo Lotion | Hada Labo | Skincare | pcs | Japan | 220 | 150000 |
| Uniqlo Airism | Uniqlo | Apparel | pcs | Japan | 120 | 199000 |

## Implementasi (untuk dev)
- `composables/useExcel.ts` — baca/tulis xlsx (SheetJS, dynamic import, client-only).
- `components/ExcelToolbar.vue` — tombol Export/Import + laporan; prop `exportRows`,
  `importRows`, `columns` (template kosong), `canExport/canImport`.
- `utils/master.ts` — `matchByName` (resolusi FK), `numCell`, `activeCell`.
- ⚠️ `xlsx@0.18.5` (registry npm) ada CVE; ganti ke CDN `0.20.x` saat memungkinkan.
