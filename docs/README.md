# Jastipin — Spec Index

Spec lengkap untuk dieksekusi oleh Claude Code. Baca berurutan.

> ✅ **STATUS: SELESAI (12/12 fase).** Spec di bawah adalah niat desain awal. Untuk
> **realita final**, baca **`06-as-built.md`** lebih dulu — di sana terdokumentasi
> apa yang benar-benar dibangun (view, trigger, multi-currency, payables = VIEW)
> dan semua deviasi dari spec. Bila berbeda, **as-built yang berlaku**.

## Cara pakai (untuk Claude Code)
1. Baca `00-overview.md` — pahami konsep & 6 keputusan inti.
2. Baca `01-architecture.md` — stack, struktur, konvensi, **RLS bertahap**.
3. Baca `02-data-model.md` — semua tabel/field (tulis SQL sendiri sesuai ini).
4. Baca `03-menu-rbac.md` — menu dynamic + permission.
5. Baca `04-modules/*` — spec per modul (tanggung jawab, tab, status, handoff).
6. Baca `06-as-built.md` — **realita implementasi & deviasi** (sumber kebenaran final).
7. Baca `07-uiux-revamp-plan.md` — **peta kerja revamp UI/UX yang lagi aktif** (sementara).

## Daftar file
```
docs/
├── README.md                  (ini)
├── 00-overview.md             konsep, glossary, prinsip
├── 01-architecture.md         stack, folder, konvensi, RLS
├── 02-data-model.md           semua tabel & relasi (deskripsi, bukan SQL final)
├── 03-menu-rbac.md            menu dynamic + RBAC
├── 04-modules/
│   ├── 01-trip.md
│   ├── 02-crm.md
│   ├── 03-order.md
│   ├── 04-product.md
│   ├── 05-fulfillment.md
│   ├── 06-warehouse.md
│   ├── 07-load-planning.md
│   ├── 08-delivery.md
│   ├── 09-finance.md
│   ├── 10-master-settings.md
│   └── 11-import-export-excel.md  panduan file import/export (kolom per master)
├── 06-as-built.md             realita implementasi + deviasi (BERLAKU bila beda)
└── 07-uiux-revamp-plan.md     peta kerja revamp UI/UX (AKTIF, sementara — dihapus saat kelar)
```

## Keputusan terkunci (ringkas)
- Stack: Nuxt 4 + @nuxt/ui 3 + Pinia + Supabase. YAGNI bertahap.
- Order menempel ke **leg** (`trip_route`), bukan trip.
- Satu entitas **product** (brand/category/sub/unit/country, + weight & dimensi).
- Fulfillment: `fulfillment_type` (`sourcing`|`drop_in`).
- **Carry-over antar leg DIIZINKAN** (dicatat di `load_items.trip_route_id`).
- Luggage = master data; product wajib weight/dimensi → Load Planning.
- Finance dipecah: receivable / payable / trip-expense; **payables = VIEW union**
  (anti double-count by design — lihat as-built).
- **Nilai turunan dihitung via VIEW**, tidak disimpan (subtotal/total/modal/profit).
- **Multi-currency:** currency + fx_rate dibekukan per transaksi → IDR saat baca.
- Menu & permission **dynamic dari DB**; permission MVP = UI only (RLS menyusul).
- Menu: 5 grup, min 2 anak, max 2 level, lebih dalam = tabs.

## Sudah ada di repo
- `continents`, `countries` (geo, ter-seed) — kini di **Master Data**.
- `profiles` + trigger auto-create (role admin/staff/customer).
- Pages: index, login, confirm.
