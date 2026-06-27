<script setup lang="ts">
import type { Database } from '~/types/database.types'

// Read-only roll-up of trip_expenses (created/edited inside Trip). They feed the
// Payables ledger as source_type='trip_expense'.
const supabase = useSupabaseClient<Database>()
const { data: items } = useAsyncData('finance-trip-expenses', async () => {
  const { data, error } = await supabase
    .from('trip_expenses')
    .select('*, trips(name, code)')
    .order('spent_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
})

type Row = Database['public']['Tables']['trip_expenses']['Row'] & { trips?: { name: string; code: string | null } | null }
const idr = (r: Row) => Math.round(Number(r.amount) * Number(r.fx_rate ?? 1))
const total = computed(() => ((items.value as Row[]) ?? []).reduce((a, r) => a + idr(r), 0))
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-semibold">Trip Expenses</h1>
        <p class="text-sm text-stone-500">Biaya operasional trip — dikelola di modul Trip, masuk ke Payables.</p>
      </div>
      <span class="text-sm text-stone-500">Total: <span class="font-semibold">{{ formatIDR(total) }}</span></span>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Trip</th>
            <th class="px-3 py-2 font-medium">Kategori</th>
            <th class="px-3 py-2 font-medium">Deskripsi</th>
            <th class="px-3 py-2 font-medium">Tanggal</th>
            <th class="px-3 py-2 font-medium text-right">Nilai (IDR)</th>
            <th class="px-3 py-2 font-medium">Struk</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="r in (items as Row[]) ?? []" :key="r.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2">
              <span class="font-mono text-xs text-stone-400 mr-1">{{ r.trips?.code }}</span>{{ r.trips?.name }}
            </td>
            <td class="px-3 py-2">{{ r.category }}</td>
            <td class="px-3 py-2 text-stone-500">{{ r.description ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ fmtDate(r.spent_at) }}</td>
            <td class="px-3 py-2 text-right tabular-nums">
              {{ formatIDR(idr(r)) }}
              <span v-if="r.currency !== 'IDR'" class="block text-xs text-stone-400">{{ r.currency }} {{ Number(r.amount).toLocaleString('id-ID') }}</span>
            </td>
            <td class="px-3 py-2">
              <a v-if="r.receipt_url" :href="r.receipt_url" target="_blank" class="text-primary text-xs underline">Lihat</a>
              <span v-else class="text-stone-400">—</span>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada biaya trip.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
