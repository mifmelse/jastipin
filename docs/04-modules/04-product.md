# Module: Product Management (Catalog)

**Grup:** Catalog · **Tabel:** products, brands, categories, sub_categories, units

## Tanggung jawab
Master barang. Satu entitas `product` dengan relasi lengkap.

## Menu items (Catalog group)
- **Products** — CRUD product.
- **Brands** — CRUD brand.
- **Categories** — CRUD category (+ tab Sub-categories).
- **Units** — CRUD unit.

## Relasi product
brand · category · sub_category · unit · country (origin).

## Field krusial
- **weight_g** (WAJIB) — tanpa ini simulasi packing ngaco.
- **length/width/height_mm** — untuk volume (sangat disarankan).
- base_price, cost_price, currency, image_url, is_active.

## Aturan bisnis
- Product reusable lintas trip & order (satu product → banyak order).
- country = asal barang; dipakai mencocokkan dengan arah leg.
