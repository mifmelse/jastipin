# Architecture

## Stack (sudah terpasang)

- **Nuxt 4** (struktur `app/` directory)
- **@nuxt/ui 3**
- **Pinia** (`@pinia/nuxt`)
- **Supabase** via `@nuxtjs/supabase` (auth + Postgres + Storage + RLS)
- Types digenerate: `npm run gen:types` → `app/types/database.types.ts`

## Struktur folder (target)

Ikuti konvensi Nuxt 4 + pola modular. Saran:

```
app/
├── pages/
│   ├── index.vue                 (dashboard)
│   ├── login.vue / confirm.vue   (sudah ada)
│   ├── operations/
│   │   ├── trips/
│   │   ├── crm/
│   │   ├── orders/
│   │   ├── fulfillment/
│   │   ├── warehouse/
│   │   ├── load-planning/
│   │   └── delivery/
│   ├── catalog/
│   │   ├── products/
│   │   ├── brands/
│   │   ├── categories/
│   │   └── units/
│   ├── finance/
│   │   ├── receivables/
│   │   ├── payables/
│   │   ├── trip-expenses/
│   │   └── reports/
│   ├── master-data/
│   │   ├── geography/
│   │   └── luggage-types/
│   └── settings/
│       ├── users/ roles/ permissions/ menu/ user-types/
├── composables/        (satu folder per domain: useTrip, useOrder, dst)
├── stores/             (Pinia: auth, dan store lintas-komponen seperlunya)
├── components/         (per domain + base/ untuk shared)
├── layouts/
├── middleware/         (auth guard, role guard)
├── types/
└── utils/

supabase/
└── migrations/         (satu migration per area/fitur, prefix timestamp)
```

> Pola yang dipakai project lama (pages → composables → services) boleh
> dipertahankan, tapi dengan Supabase, **composables langsung pakai Supabase
> client** (tidak perlu layer `services/` REST manual kecuali ada API server).

## Konvensi

- **Penamaan tabel**: `snake_case`, plural (`trips`, `order_items`).
- **PK**: `uuid default gen_random_uuid()`. FK pakai `on delete` eksplisit
  (`restrict` untuk reference, `cascade` untuk child, `set null` bila opsional).
- **Timestamps**: `created_at timestamptz not null default now()`; tambah
  `updated_at` bila entitas sering diedit (pakai trigger).
- **Status**: simpan sebagai `text` + `check (... in (...))` mengikuti daftar di
  `02-data-model.md`. (Boleh enum Postgres, tapi `text+check` lebih mudah
  diubah dan konsisten dengan style migration yang sudah ada.)
- **Money**: simpan `numeric(14,2)`. Selalu sertakan `currency` (text, ISO 4217)
  bila lintas negara. Kurs disimpan eksplisit saat transaksi (jangan hitung ulang).
- **Berat**: `numeric` dalam **gram** (hindari float). **Dimensi**: mm.
- **Kode human-readable**: entitas yang dilihat user (trip, order) punya kolom
  `code` unik (mis. `TRP-0001`, `ORD-0001`) selain uuid.

## Currency policy (multi-currency)

Operator belanja di luar negeri & punya biaya trip lintas mata uang, jadi catatan
keuangan WAJIB multi-currency dan tidak boleh ambigu.

- **Base / reporting currency = IDR.** Semua ringkasan (cashflow, profit per
  order/trip/leg, receivable/payable) dilaporkan dalam IDR.
- **Tiap transaksi simpan mata uang aslinya** (`currency`, ISO 4217) **+ `fx_rate` ke
  IDR pada saat transaksi**. Kurs di-freeze saat kejadian — jangan dihitung ulang
  belakangan (lihat `sourcing_records`, `payables`, `trip_expenses`, `payments`).
- **Nilai IDR diturunkan** = `amount × fx_rate`; jangan disimpan sebagai kolom kalau
  bisa dihitung (hindari basi). Simpan hasil hanya bila kurs perlu di-snapshot permanen
  (mis. `sourcing_records.actual_total`).
- Transaksi yang sudah IDR → `fx_rate = 1`.

## Strategi RLS (PENTING)

Bertahap, YAGNI:

- **LANGKAH 1 (MVP, sekarang)**: setiap tabel `enable row level security` +
  policy `authenticated full access` (using true / with check true). Sama seperti
  yang sudah ada di migration `geo` & `profiles`. Semua staff terautentikasi
  bisa CRUD.
- **LANGKAH 2 (nanti)**: per-role policy berbasis `profiles.role` dan/atau
  permission. **Jangan dibangun sekarang.**

> **Konsekuensi**: di MVP, **menu/permission hanya mengatur tampilan UI**
> (sembunyikan menu/tombol). Pengamanan data sebenarnya (row-level) BELUM aktif.
> Jangan berasumsi permission = keamanan data di fase ini. Tulis ini di mana pun
> relevan agar tidak ada ekspektasi keliru.

## Auth

- `profiles` extends `auth.users` (sudah ada), trigger auto-create profile.
- Role di `profiles.role`: `admin | staff | customer`. Tambah `traveler` bila
  diperlukan sebagai role lapangan (lihat `03-menu-rbac.md`).
- Middleware: `auth` (wajib login) + `role`/`permission` guard untuk route
  (visibility, bukan RLS).

## Migration discipline

- Satu migration per area, prefix timestamp `YYYYMMDDHHMMSS_nama.sql`.
- Idempotent seed pakai `on conflict do nothing` (ikuti pola `geo`).
- Setelah migrasi skema, **regenerate types**: `npm run gen:types`.
