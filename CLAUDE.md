# Jastipin — Panduan untuk AI Agent

File ini = **aturan kerja untuk AI** yang mengerjakan repo ini. **Bukan** dokumentasi
bisnis/sistem — itu hidup di `docs/`. Jangan campur: alur sistem & aturan bisnis ke
`docs/`, aturan perilaku AI ke sini.

## Sumber kebenaran
- **Spec bisnis & teknis:** `docs/` — baca berurutan `00-overview` → `01-architecture`
  → `02-data-model` → `03-menu-rbac` → `04-modules/*` → `05-execution-plan`.
  Jangan duplikasi isinya di sini; rujuk saja.
- **Urutan build:** ikuti `docs/05-execution-plan.md`, fase per fase, jangan loncat.

## Git
- **JANGAN** `git commit` / `git push` tanpa perintah eksplisit dari user. Tunjukkan
  perubahan di working tree, biar user yang putuskan kapan commit.
- Saat diminta commit: pesan **bersih**, tanpa trailer `Co-Authored-By` atau sejenisnya.

## Cara kerja
- Bangun **satu domain utuh** (migration → `npm run gen:types` → composable → page/tabs
  → form) sampai jalan, **baru** lanjut domain berikutnya.
- **Tanyakan dulu** setiap keputusan arsitektur baru. Jangan putuskan sendiri.
- Verifikasi sebelum klaim selesai: migration jalan tanpa error, types ter-generate,
  CRUD berfungsi di UI.

## Konvensi kode
- TypeScript: pakai **generated types** Supabase (`app/types/database.types.ts`).
  **JANGAN pakai `any`.**
- **Aturan bisnis hidup di database** (RPC / constraint / view), bukan di komponen Vue.
- Operasi multi-tabel = **satu RPC transaksional** (rollback bila ada langkah gagal).
- Jangan simpan nilai turunan (total / subtotal / saldo) sebagai kolom — hitung via
  VIEW / RPC dari sumber kebenaran.
- `@nuxt/ui 3` untuk komponen; Pinia hanya untuk state lintas-komponen.
- KISS, DRY, YAGNI, SoC. Jangan bikin abstraksi sebelum ada pengulangan nyata.

## Keamanan (fase MVP)
- RLS = LANGKAH 1: `authenticated full access` untuk semua tabel baru.
- Permission / menu **mengatur tampilan UI saja**, BUKAN row-level security. Jangan
  anggap permission = keamanan data di fase ini.

## Rahasia
- `.env` berisi kredensial (gitignored). Jangan pernah commit kunci/secret.
