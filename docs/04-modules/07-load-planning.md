# Module: Load Planning

**Grup:** Operations · **Tabel:** luggages, load_items, luggage_types (master)

## Tanggung jawab
Memuat barang ke luggage dengan simulasi berat & volume, patuh regulasi.
Jantung operasional sebelum berangkat.

## Tab dalam halaman
- **Packing Board** — drag barang (order_items siap) ke luggage. Barang BOLEH
  diacak lintas customer demi maksimalkan ruang.
- **Luggage** — instance `luggages` untuk trip ini (pilih dari `luggage_types`),
  assign ke traveler.
- **Simulation** — hitung per luggage: Σ weight_g + tare ≤ max_weight_g;
  volume ≤ max_volume. Tampilkan over/under, sisa kapasitas, peringatan regulasi.

## Aturan bisnis
- Luggage instance dibuat dari master `luggage_types`.
- `load_items` mencatat order_item → luggage + **trip_route_id (leg)**.
  Ini kunci **carry-over**: satu item bisa dibawa di leg berbeda.
- Yang wajib akurat: **berat & volume** (ambil dari warehouse_items aktual,
  fallback ke product).
- Status luggage: `planned → packed → loaded → unloaded`.
- Item yang sudah dimuat → status `packed`.

## Handoff
Luggage `loaded` → dibawa traveler sesuai leg → setelah tujuan → Delivery.
