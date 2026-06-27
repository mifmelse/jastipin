# Module: Warehouse

**Grup:** Operations · **Tabel:** warehouse_items

## Tanggung jawab
Barang DIAM di tempat kita: intake, sortir, cek kondisi, timbang aktual, stok.

## Tab dalam halaman
- **Inbound/Intake** — terima item dari Fulfillment, set lokasi/rak, timbang
  (`weighed_g`) & ukur (penting untuk akurasi packing).
- **Stock** — item yang sudah di gudang & belum packed.

> → **as-built:** halaman jadi **2 tab** (Intake + Stock). "Conditions" tidak jadi
> tab terpisah — kondisi (`good/damaged/missing`) sudah jadi kolom + **filter** di
> dalam Stock (sumber data sama, hindari duplikasi). Tidak ada hapus stok: barang
> keluar gudang lewat packing (Load Planning), bukan delete.

## Aturan bisnis
- **Berat & dimensi aktual** ditimbang di sini lebih diutamakan daripada nilai
  estimasi dari product (override untuk simulasi packing).
- Item status → `in_warehouse`.

## Handoff
Warehouse selesai = item siap di-assign ke luggage → Load Planning.
