# Module: Fulfillment

**Grup:** Operations · **Tabel:** order_items, **sourcing_records**, **drop_in_intakes**

## Tanggung jawab
Bagaimana barang jadi ada di tangan kita. Dua jalur, dibedakan
`order_items.fulfillment_type` (`sourcing` | `drop_in`). Tiap jalur punya tabel
detail sendiri agar `order_items` tetap bersih (soal transaksi), dan proses
fisik/operasional belanja punya rumah sendiri.

**Keputusan terkunci:** pakai tabel terpisah (BUKAN sekadar status di order_items).
Alasan: shopper berpatok ke workspace ini saat belanja — butuh data kaya
(struk, harga aktual, kurs, toko, substitusi, foto).

## Tab dalam halaman
- **Sourcing** — workspace shopper. Daftar item `fulfillment_type=sourcing`
  per trip/leg. Tiap item punya satu `sourcing_records`. Shopper update di sini:
  status, toko, harga aktual, kurs, upload struk, substitusi. **Workspace inti.**
- **Drop-in Intake** — terima barang yang dikirim customer sendiri. Tiap item
  `fulfillment_type=drop_in` punya satu `drop_in_intakes`: tanggal terima,
  kondisi, foto, kurir asal.

## Aturan bisnis
- Satu `order_item` → maksimal satu record fulfillment sesuai tipenya
  (sourcing_records untuk sourcing, drop_in_intakes untuk drop_in).
- Sourcing relevan untuk leg menuju home base (barang dibeli di luar).
- Drop-in relevan untuk leg outbound (titip barang pribadi).
- `sourcing_records.actual_total` (harga aktual × kurs) → feed Finance Payable
  (kategori sourcing). Inilah modal belanja sebenarnya.
- Status item disetir oleh proses di sini:
  - sourcing: `pending → sourcing → purchased` (atau `out_of_stock`)
  - drop_in: `pending → received`
- Substitusi: bila barang asli tak ada, shopper catat barang pengganti di
  `sourcing_records` (is_substitute + catatan), status tetap `purchased`.

## Handoff
Item `purchased`/`received` → Warehouse (intake, timbang aktual).
`sourcing_records.actual_total` → Finance Payable.
