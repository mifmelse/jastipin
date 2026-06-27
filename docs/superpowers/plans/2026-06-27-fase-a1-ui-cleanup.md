# FASE A1 — UI Cleanup (leg→route, FAB, button polish) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rapikan UI tanpa sentuh DB — ganti istilah tampilan "leg"→"route", samakan tombol tambah di Trip detail jadi FAB, dan poles tombol-aksi-dalam-tabel.

**Architecture:** Murni perubahan template/label Vue + e2e. Tidak ada migration, tidak ada perubахan identifier kode (var/composable/type tetap `leg*`/`useAllLegs`/`LegEmbed`). Verifikasi lewat `npm run build` + Playwright e2e (prod build, port 3100), commit per task.

**Tech Stack:** Nuxt 4, @nuxt/ui 3, Tailwind, Playwright.

**Aturan proyek:** e2e dijalankan terhadap PROD build (`npm run build` dulu). Jangan ubah identifier kode. Jangan sentuh `database.types.ts`, `app/assets/css/main.css` (kemunculan "leg" di situ = bagian kata lain spt "legend"/"col-span", bukan istilah).

---

## Konteks: apa yang dianggap "teks tampilan"
Ganti HANYA string yang dirender ke user (di dalam `<template>`, `label=`, `placeholder=`, `help=`, `title=`, judul kolom `<th>`, opsi select, subtitle PageHeader). Pola: kata berdiri sendiri **"Leg"** / **"leg"** yang merujuk konsep rute → jadi **"Route"** / **"route"**.

JANGAN ubah: `legId`, `legOptions`, `legLabel`, `LegEmbed`, `useAllLegs`, `trip_route*`, `from_country`, nama file, komentar kode.

Contoh konkret yang HARUS berubah (cari dengan grep di Task 1):
- `Leg (trip route)` → `Route`
- `<th ...>Leg</th>` → `Route` (judul kolom)
- `help="Order menempel ke leg, bukan trip."` → `...ke route, bukan trip.`
- `help="Carry-over: pilih leg mana barang ini diangkut."` → `...pilih route mana...`
- `subtitle="...1 customer untuk 1 leg."` → `...1 route.`
- `placeholder="Pilih leg…"` → `Pilih route…`
- label `Leg pengantaran`/`leg` di Delivery/Order/LoadPlanning → `Route`
- `Tidak ada trip aktif`/dst yang mengandung kata "leg" → "route"

---

### Task 1: Rename istilah tampilan "leg" → "route"

**Files (template text saja):**
- Modify: `app/pages/operations/orders/index.vue`, `app/pages/operations/trips/[id].vue`, `app/pages/operations/trips/index.vue`, `app/pages/operations/load-planning.vue`, `app/pages/index.vue`
- Modify: `app/components/order/Info.vue`, `app/components/trip/RoutesPanel.vue`, `app/components/trip/Overview.vue`, `app/components/loadplanning/PackingBoard.vue`, `app/components/fulfillment/SourcingPanel.vue`, `app/components/fulfillment/DropInPanel.vue`, `app/components/delivery/ShipmentsPanel.vue`, `app/components/delivery/TrackingPanel.vue`, `app/components/crm/PipelineBoard.vue`
- Test: existing e2e (sesuaikan assertion teks "Leg" bila ada)

- [ ] **Step 1: Inventaris string tampilan**

Run: `grep -rnE "[\">( ][Ll]eg([ .,…)\"<]|Leg \(|leg pengantaran|leg, bukan|Pilih leg|untuk 1 leg|leg mana" app/pages app/components`
Tinjau tiap hit: kalau di dalam template/label/placeholder/help/th/option dan berarti "rute" → kandidat ganti. Skip kalau itu bagian identifier kode (mis. `legOptions`, `legLabel(`, `:legId`).

- [ ] **Step 2: Ganti tiap string display "Leg"→"Route" dan "leg"→"route"**

Untuk tiap file di atas, edit hanya teks yang dirender. Pertahankan kapitalisasi (judul kolom `Leg`→`Route`, frasa `leg`→`route`). Contoh edit di `app/pages/operations/orders/index.vue`:
- `<th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Leg</th>` → `...>Route</th>`
- `subtitle="Transaksi inti — 1 customer untuk 1 leg."` → `subtitle="Transaksi inti — 1 customer untuk 1 route."`
- `<UFormField label="Leg (trip route)" required help="Order menempel ke leg, bukan trip.">` → `label="Route" required help="Order menempel ke route, bukan trip."`
- `placeholder="Pilih leg…"` → `placeholder="Pilih route…"`

Lakukan setara di tiap file (RoutesPanel judul/teks, LoadPlanning leg filter & help, Delivery "leg pengantaran"/"Leg" kolom, Order/Info "leg", PackingBoard "leg" help, Sourcing/DropIn/Tracking/Pipeline label "Leg").

- [ ] **Step 3: Sesuaikan e2e yang assert teks "Leg"**

Run: `grep -rn "'Leg'\|\"Leg\"\|getByText('Leg\|name: 'Leg" e2e/`
Kalau ada assertion yang nyari teks "Leg" sebagai label visible, ganti ke "Route". (Pemilihan leg di e2e mayoritas via opsi tanggal/`nth()`, bukan kata "Leg" — kemungkinan minim/0 perubahan.)

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: diakhiri "✨ Build complete!"

- [ ] **Step 5: e2e modul terdampak**

Run: `npx playwright test orders trips load-planning delivery fulfillment --reporter=line`
Expected: semua passed. Kalau ada yang gagal karena teks, perbaiki assertion (Step 3) atau string.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "UI A1: rename display term leg→route (labels only, code identifiers unchanged)"
```

---

### Task 2: FAB konsisten di Trip detail (Bookings/Expenses/Routes)

**Files:**
- Read (acuan): `app/components/trip/Itinerary.vue`, `app/components/FabAdd.vue` (pola FAB yang sudah dipakai)
- Modify: `app/components/trip/BookingsPanel.vue`, `app/components/trip/ExpensesPanel.vue`, `app/components/trip/RoutesPanel.vue`

- [ ] **Step 1: Pelajari pola FAB**

Run: `cat app/components/FabAdd.vue app/components/trip/Itinerary.vue`
Catat: bagaimana `FabAdd` dipasang (event `@add`/`@click` → buka modal) dan posisinya (floating).

- [ ] **Step 2: Ganti tombol "Tambah" stack jadi FAB di tiap panel**

Di `BookingsPanel.vue`, `ExpensesPanel.vue`, `RoutesPanel.vue`: hapus tombol "Tambah" yang stacked di atas/bawah daftar, ganti dengan `<FabAdd @add="openCreate" />` (atau handler create yang sudah ada di tiap panel — cek nama fungsinya, mis. `openCreate`/`open = true`). Pertahankan label/aria yang sama bila ada teks. Untuk Routes, hormati aturan `canAdd` (single/round/multi) — FAB hanya muncul saat boleh nambah (`v-if="canAdd"`).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: "✨ Build complete!"

- [ ] **Step 4: e2e trips**

Run: `npx playwright test trips --reporter=line`
Expected: passed. (trips.spec "slice B" pakai Bookings/Expenses — pastikan FAB-nya kebuka modal yang sama. Bila e2e nyari tombol via teks "Tambah", sesuaikan ke aria-label FAB atau tambah `aria-label`/teks yang dicari.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "UI A1: FAB for add actions in Trip detail (Bookings/Expenses/Routes) — consistent with Itinerary/Moments"
```

---

### Task 3: Polish tombol-aksi-dalam-tabel (Warehouse + Delivery)

**Files:**
- Modify: `app/components/warehouse/IntakePanel.vue` (tombol "Terima & timbang"), `app/components/delivery/ProofPanel.vue` (tombol "Bukti & selesai")

- [ ] **Step 1: Seragamkan style tombol aksi di sel tabel**

Pola target (kecil, rapi, ikon + teks, sejajar kanan): `size="xs" color="primary" variant="soft"` dengan ikon yang sudah ada. Pastikan kedua tombol konsisten satu sama lain dan tidak meluber di kolom sempit (boleh `class="whitespace-nowrap"`). Pertahankan teks & aria-label persis (e2e bergantung: "Terima & timbang", "Bukti & selesai").

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: "✨ Build complete!"

- [ ] **Step 3: e2e warehouse + delivery**

Run: `npx playwright test warehouse delivery --reporter=line`
Expected: passed (teks tombol tidak berubah → selector aman).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "UI A1: consistent in-table action buttons (Warehouse intake, Delivery proof)"
```

---

### Task 4: Verifikasi penuh + dokumentasi

- [ ] **Step 1: Full e2e**

Run: `npx playwright test --reporter=line`
Expected: semua passed (jumlah sama seperti sebelum A1).

- [ ] **Step 2: Centang A1 di plan revamp**

Modify `docs/07-uiux-revamp-plan.md`: tandai item A1 selesai (mis. tambah ✅ di poin A1).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: mark FASE A1 (UI cleanup) done in revamp plan"
```

---

## Self-Review
- **Spec coverage:** A1 spec = (rename leg→route, FAB konsisten, button polish). Task 1=rename, Task 2=FAB, Task 3=button, Task 4=verify+doc. ✅
- **Placeholder scan:** tidak ada TBD; rename pakai grep+aturan eksplisit (mekanis, bukan vague). ✅
- **Konsistensi:** identifier kode sengaja TIDAK diubah (hanya teks tampilan) — konsisten di semua task. ✅
- **Risiko e2e:** teks tombol/aria dipertahankan; risiko hanya pada assertion teks "Leg" (ditangani Task 1 Step 3).
