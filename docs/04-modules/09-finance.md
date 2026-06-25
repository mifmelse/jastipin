# Module: Finance Management

**Grup:** Finance · **Tabel:** payments (receivable), payables, trip_expenses (sumber)

## Tanggung jawab
Semua aktivitas uang perusahaan. Dipecah receivable vs payable agar cashflow
jastip (sering nalangin) terkontrol.

## Menu items
- **Receivables** — `payments`: uang masuk dari customer per order.
  Status: `pending → paid` (+ `refunded`).
- **Payables** — `payables`: modal keluar (sourcing actual_price, shipping,
  trip_expense, other). Status: `unpaid → paid`. Simpan `fx_rate` saat transaksi.
- **Trip Expenses** — view/manage `trip_expenses` (juga diakses dari Trip).
- **Reports** — agregasi: profit per order/trip/leg, cashflow, AR/AP aging.

## Aturan bisnis (anti double-count)
- **payables = ledger tunggal** modal keluar. trip_expenses & sourcing actual
  price FEED ke payables (atau payables mereferensikan sumbernya via
  source_type/source_id). Pilih SATU mekanisme, jangan hitung dua kali.
- Money: `numeric(14,2)` + currency ISO 4217. Lintas negara → simpan fx_rate.
- Profit = receivable − (modal + ongkir + biaya trip teralokasi).

## Handoff
Menerima dari: Order (payment), Fulfillment (sourcing cost), Delivery (shipping),
Trip (expenses).
