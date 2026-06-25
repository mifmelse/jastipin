# Jastipin

Admin panel / ERP internal untuk bisnis **jasa titip (jastip)** berbasis traveler —
dijalankan oleh satu operator. Operator merencanakan trip ke luar negeri, customer
menitip barang yang menempel pada trip tersebut; aplikasi mengelola seluruh proses
(trip, order, pembelian/sourcing, gudang, packing, pengiriman, dan keuangan
multi-currency) dalam satu tempat.

> Repo ini adalah admin panel-nya; web customer menyusul.

## Tech stack

- **Frontend:** [Nuxt 4](https://nuxt.com) · Vue 3 · [Nuxt UI 3](https://ui.nuxt.com) · Pinia
- **Backend:** [Supabase](https://supabase.com) — Postgres, Auth, Storage, Row Level Security
- **Logika bisnis:** Postgres RPC (PL/pgSQL) untuk operasi multi-tabel transaksional
- **Bahasa:** TypeScript penuh (tipe digenerate dari skema Supabase)

## Status

Dalam pengembangan bertahap (lihat [`docs/05-execution-plan.md`](docs/05-execution-plan.md)).

- [x] Fondasi: Supabase + Auth, profiles + trigger, geography seed
- [x] RBAC + dynamic menu (roles, permissions, menu dari DB → sidebar terfilter)
- [x] Settings: Users, Roles, Permissions, Menu, User Types
- [ ] Master Data UI · Catalog · Trip · CRM · Order · Fulfillment · Warehouse ·
      Load Planning · Delivery · Finance

## Prasyarat

- [Node.js](https://nodejs.org) 20.19+ atau 22.12+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Sebuah project Supabase (Postgres + Auth)

## Memulai

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env        # lalu isi nilainya (lihat tabel di bawah)

# 3. Terapkan skema database ke project Supabase
supabase link --project-ref <project-ref>
supabase db push

# 4. Generate TypeScript types dari skema
npm run gen:types

# 5. Jalankan dev server
npm run dev
```

Buka http://localhost:3000 dan login dengan akun admin.

## Environment variables

| Variable | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase (`https://<ref>.supabase.co`) |
| `SUPABASE_KEY` | Anon/public key — dipakai client |
| `SUPABASE_SERVICE_KEY` | Service-role key — **server-only**, dipakai route admin. Jangan diekspos ke client |
| `SUPABASE_PAT` | Personal Access Token Supabase CLI (migrations & type gen) |

`.env` tidak di-commit (lihat `.gitignore`).

## Scripts

| Script | Aksi |
|---|---|
| `npm run dev` | Jalankan dev server (HMR) |
| `npm run build` | Build untuk produksi |
| `npm run preview` | Preview hasil build |
| `npm run gen:types` | Generate `app/types/database.types.ts` dari skema Supabase |

## Struktur proyek

```
app/                  Kode Nuxt (srcDir)
├── components/       Komponen per domain
├── composables/      Logika UI per domain (langsung pakai Supabase client)
├── layouts/          Shell admin (sidebar + topbar)
├── pages/            Routing per management area
├── plugins/          Mis. sinkronisasi sesi auth
├── stores/           Pinia (auth, dll)
└── types/            Generated DB types + tipe domain
server/api/           Route server (operasi service-role, mis. user admin)
supabase/migrations/  Skema sebagai migration files (sumber kebenaran)
docs/                 Spesifikasi bisnis & teknis
CLAUDE.md             Aturan kerja untuk AI agent
```

## Dokumentasi

- **Spesifikasi bisnis & teknis:** [`docs/`](docs/) — baca berurutan `00` → `05`.
- **Aturan kerja AI agent:** [`CLAUDE.md`](CLAUDE.md).
- Aturan bisnis hidup di database (RPC/constraint); komponen Vue hanya memanggil.
  Nilai turunan (total/saldo) dihitung via VIEW/RPC, tidak disimpan.
