# Module: Delivery

**Grup:** Operations · **Tabel:** shipments

## Tanggung jawab
Last-mile ke penerima setelah barang tiba di negara tujuan leg.

## Tab dalam halaman
- **Shipments** — buat pengiriman (per order, atau per item bila perlu),
  pilih courier, generate/isi tracking_no, tautkan ke leg pengantaran.
- **Tracking** — status `pending → in_transit → delivered` (atau `failed`).
- **Proof of Delivery** — upload bukti (foto/tanda tangan), delivered_at.

## Aturan bisnis
- Shipment terikat `trip_route_id` (leg tempat barang diantar ke tujuan).
- Item terkirim → status `delivered`; saat semua item order delivered →
  order `delivered` → `completed`.

## Handoff
Delivered → tutup order. shipping_cost → Finance Payable (kategori shipping).
