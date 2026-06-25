# Module: CRM

**Grup:** Operations · **Tabel:** crm_pipeline, crm_activities, customers

## Tanggung jawab
Funnel customer: dari reach sampai repeat. Mengelola lead, percakapan, konversi
ke order, dan retensi.

## Tab dalam halaman
- **Pipeline** — board/list per stage: `reach → lead → conversation → order → repeat`.
- **Contacts** — daftar customer (entitas `customers`).
- **Activities** — log `crm_activities` (note/call/message/follow_up).

## Aturan bisnis
- Lead bisa belum jadi `customer` (customer_id nullable di pipeline). Saat
  konversi, buat/relasikan ke `customers`.
- Lead bisa ditautkan ke `trip_id` (lead untuk trip mana).
- Stage `order` → memicu pembuatan Order (handoff ke Order Management).
- Reach customer biasanya dilakukan SETELAH trip dibuat (ada yang ditawarkan).

## Handoff
CRM stage `order` → Order Management. Customer → dipakai Order & Delivery.
