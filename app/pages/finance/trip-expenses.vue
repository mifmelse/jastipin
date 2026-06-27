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
    <PageHeader title="Trip Expenses" subtitle="Biaya operasional trip — dikelola di modul Trip, masuk ke Payables." icon="i-lucide-receipt">
      <template #actions>
        <span class="text-sm text-stone-500">Total: <span class="font-semibold">{{ formatIDR(total) }}</span></span>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Trip</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Kategori</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Deskripsi</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Tanggal</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Nilai (IDR)</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Struk</th>
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
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">
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

    <div class="md:hidden space-y-2">
      <div
        v-for="r in (items as Row[]) ?? []"
        :key="r.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ r.trips?.name }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ r.trips?.code }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ r.category }} · {{ fmtDate(r.spent_at) }}</span>
          <span class="font-semibold text-primary tabular-nums shrink-0">{{ formatIDR(idr(r)) }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada biaya trip.</p>
    </div>
  </div>
</template>
