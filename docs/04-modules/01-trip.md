# Module: Trip Management

**Grup:** Operations · **Tabel:** trips, trip_routes, trip_bookings, trip_expenses, trip_moments

## Tanggung jawab
Container utama semua aktivitas. Mengatur perjalanan, rute (leg), itinerary,
booking, biaya, dan dokumentasi.

## Tab dalam halaman
- **Overview** — info trip, type, traveler_count, kapasitas, status.
- **Routes/Legs** — kelola `trip_routes`. Single=1 leg, Round=2 (pergi+pulang),
  Multi=N (origin leg N = destination leg N-1, auto-chain saat tambah leg).
- **Itinerary** — rencana per hari (MVP: teks/JSON; bisa tabel nanti).
- **Bookings** — `trip_bookings` (flight/hotel/transport).
- **Expenses** — `trip_expenses`, feed ke Finance Payable.
- **Moments** — `trip_moments` (dokumentasi, future).

## Status
`draft → planned → ongoing → completed` (+ `cancelled`).

## Aturan bisnis
- Trip harus dibuat DULU sebelum order bisa masuk (trip = container).
- Kapasitas riil dihitung dari `luggages` (Load Planning), bukan hanya
  `total_capacity_kg`.
- Trip code auto-generate `TRP-xxxx`.

## Handoff
Trip → menyediakan `trip_routes` (leg) yang dipakai Order, Load Planning,
Delivery. Expenses → Finance.
