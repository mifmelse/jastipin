# Jastipin — Overview

> Spec untuk dieksekusi oleh Claude Code. Dokumen ini mengunci **konsep & keputusan**.
> Detail teknis per area ada di file lain dalam `/docs`.

## Apa itu Jastipin

Admin/ERP untuk bisnis **jasa titip (jastip)**: barang dibawa lintas negara oleh
traveler. Dua arah aktivitas:

1. **Sourcing** — shopper membelanjakan barang yang di-request customer di negara asal.
2. **Drop-in** — customer mengirim barang pribadinya ke kantor untuk dititipkan.

Barang dikumpulkan, disortir, dimuat ke **luggage** (koper/kabin/backpack/tote)
dengan simulasi berat & volume, dibawa traveler sesuai **rute (leg)**, lalu
dikirim last-mile ke penerima di negara tujuan.

## Konsep inti yang WAJIB dipegang

### 1. Semuanya berputar di sekitar TRIP dan ROUTE/LEG
- **Trip** = container utama. Membatasi kapasitas & jadwal.
- **Trip punya banyak `trip_routes` (legs)**. Tiap leg = ruas perjalanan dari
  satu negara ke negara lain dengan tanggal keberangkatan.
- **Order menempel ke LEG (`trip_route`), bukan ke trip.** Arah leg menentukan
  barang apa (asal) dikirim ke mana (tujuan).
- Trip type: `single` | `round` | `multi`.
  - `single`: 1 leg.
  - `round`: leg pergi + leg pulang.
  - `multi`: banyak leg berurutan; origin leg N = destination leg N-1.

### 2. Carry-over antar leg DIIZINKAN
Pada multi-trip, barang dari leg sebelumnya boleh "nebeng" ke leg berikutnya.
Artinya satu order_item bisa relevan melewati >1 leg dalam trip yang sama.
(Detail aturan di `04-modules/03-order.md`.)

### 3. Satu entitas Product
Tidak ada pemisahan product vs catalog. **Satu `product`** dengan relasi:
brand, category, sub-category, unit, country (origin). Product WAJIB punya
`weight` dan `dimensions` agar simulasi packing akurat.

### 4. Fulfillment dua jalur, satu field
Dibedakan via `fulfillment_type` pada order item: `sourcing` | `drop_in`.
Bukan tabel terpisah.

### 5. Finance dipecah
Receivable (uang masuk customer) · Payable (modal belanja, ongkir) ·
Trip Expense (biaya operasional trip). Cashflow jastip rawan karena sering
nalangin dulu.

### 6. Luggage = master data
Koper bagasi, koper kabin, backpack, totebag — beragam, jadi master data
(`luggage_types`) dengan max weight, volume/dimensi, tare weight, regulasi.
Barang dimuat ke luggage **tidak harus per customer** — diacak demi maksimalkan
ruang & patuh regulasi. Yang krusial diketahui: **berat & volume** tiap barang.

## Peran (roles)

- **admin** — akses penuh.
- **staff** — admin per management (operasional harian).
- **traveler** — staff yang melakukan perjalanan; menjalankan fulfillment →
  packing → delivery di lapangan.
- **customer** — pemesan (belum tentu login di MVP; bisa dikelola via CRM).

## Glossary

| Istilah | Arti |
|---|---|
| Trip | Perjalanan jastip, container utama |
| Leg / Route (`trip_route`) | Ruas perjalanan A→B dengan tanggal |
| Order | Pesanan 1 customer untuk 1 leg (header) |
| Order item | 1 baris produk dalam order |
| Sourcing | Shopper belanja barang request customer |
| Drop-in | Customer kirim barang sendiri ke kantor |
| Luggage | Wadah angkut (koper/kabin/backpack/tote) |
| Load Planning | Proses memuat barang ke luggage + simulasi berat/volume |
| Receivable | Piutang / uang masuk dari customer |
| Payable | Utang / modal keluar (belanja, ongkir) |

## Prinsip kerja

- **YAGNI bertahap.** Jangan over-engineer. RLS dimulai dari "authenticated =
  full access" (LANGKAH 1); per-role row security menyusul.
- **Konsisten penamaan** dengan tabel & komentar yang sudah ada.
- **Permission MVP mengatur UI (menu visibility), BUKAN row-level security.**
  RLS sebenarnya ditunda — lihat `01-architecture.md`.
