# Module: Order Management

**Grup:** Operations · **Tabel:** orders, order_items

## Tanggung jawab
Transaksi inti. Order = 1 customer untuk 1 leg (`trip_route`). Item = produk
atau barang titipan.

## Tab dalam halaman
- **Order Info** — customer, trip_route (leg), alamat, status, total.
- **Items** — `order_items`: product/free-text, qty, fulfillment_type, harga,
  berat/dimensi.
- **Payment** — ringkas pembayaran (detail di Finance Receivable).
- **Timeline** — riwayat status.

## Status
Order: `draft → confirmed → paid → fulfilling → packed → in_transit →
delivered → completed` (+ `cancelled`, `refunded`).
Item: `pending → sourcing → purchased`/`received` → `in_warehouse → packed →
delivered` (+ `out_of_stock`, `cancelled`).

## Aturan bisnis
- **Order menempel ke LEG** (`trip_route_id`), bukan trip langsung.
- Alamat customer difilter sesuai negara tujuan leg.
- `fulfillment_type` per item: `sourcing` (shopper belanja) | `drop_in`
  (customer kirim sendiri).
- Item tanpa produk katalog (drop-in) → `product_id` null, isi `item_name`.

## Carry-over antar leg (DIIZINKAN)
Pada multi-trip, barang boleh dibawa melewati >1 leg dalam trip yang sama.
Implementasi: leg aktual saat barang dimuat dicatat di `load_items.trip_route_id`
(Load Planning), sehingga satu order_item bisa muncul di beberapa leg.
Order tetap "dimiliki" oleh leg pemesanan (`orders.trip_route_id`), tapi
pengangkutan fisik bisa lintas leg. **Jangan paksa 1 item = 1 leg di level fisik.**

## Handoff
Order confirmed → Fulfillment (sourcing/drop-in). Item received → Warehouse →
Load Planning → Delivery. Payment → Finance Receivable.
