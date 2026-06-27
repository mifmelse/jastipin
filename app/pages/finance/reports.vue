<script setup lang="ts">
type Ar = { paid_idr: number; outstanding_idr: number }
type Payable = { amount_idr: number; status: string }
type Pnl = { trip_id: string; code: string | null; name: string; revenue_idr: number; cost_idr: number; profit_idr: number }

const { items: ar } = useReceivables()
const { items: payables } = usePayables()
const { items: pnl } = useTripPnl()

const sum = (arr: number[]) => arr.reduce((a, b) => a + Number(b || 0), 0)

const arOutstanding = computed(() => sum(((ar.value as Ar[]) ?? []).map((r) => r.outstanding_idr)))
const cashIn = computed(() => sum(((ar.value as Ar[]) ?? []).map((r) => r.paid_idr)))
const apUnpaid = computed(() => sum(((payables.value as Payable[]) ?? []).filter((p) => p.status === 'unpaid').map((p) => p.amount_idr)))
const cashOut = computed(() => sum(((payables.value as Payable[]) ?? []).filter((p) => p.status === 'paid').map((p) => p.amount_idr)))
const netCash = computed(() => cashIn.value - cashOut.value)

const kpis = computed(() => [
  { label: 'Kas masuk (terbayar)', value: cashIn.value, color: 'text-success' },
  { label: 'Kas keluar (lunas)', value: cashOut.value, color: 'text-error' },
  { label: 'Kas bersih', value: netCash.value, color: netCash.value >= 0 ? 'text-success' : 'text-error' },
  { label: 'Piutang (AR) belum tertagih', value: arOutstanding.value, color: 'text-warning' },
  { label: 'Hutang (AP) belum dibayar', value: apUnpaid.value, color: 'text-warning' },
])
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Reports" subtitle="Cashflow, piutang/hutang, dan profit per trip." icon="i-lucide-chart-bar" />

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div v-for="k in kpis" :key="k.label" class="rounded-lg border border-stone-200 dark:border-stone-800 p-3">
        <p class="text-xs text-stone-500">{{ k.label }}</p>
        <p class="text-lg font-semibold tabular-nums mt-1" :class="k.color">{{ formatIDR(k.value) }}</p>
      </div>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Profit per trip</h2>
      <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-stone-100 dark:bg-stone-800/40 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
            <tr>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Trip</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Revenue</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Modal/biaya</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
            <tr v-for="t in (pnl as Pnl[]) ?? []" :key="t.trip_id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
              <td class="px-3 py-2">
                <span class="font-mono text-xs text-stone-400 mr-1">{{ t.code }}</span>{{ t.name }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">{{ formatIDR(t.revenue_idr) }}</td>
              <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ formatIDR(t.cost_idr) }}</td>
              <td class="px-3 py-2 text-right tabular-nums font-medium" :class="t.profit_idr >= 0 ? 'text-success' : 'text-error'">
                {{ formatIDR(t.profit_idr) }}
              </td>
            </tr>
            <tr v-if="!(pnl?.length)">
              <td colspan="4" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-2">
        <div
          v-for="t in (pnl as Pnl[]) ?? []"
          :key="t.trip_id"
          class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium truncate">{{ t.name }}</span>
              <span class="font-mono text-xs text-stone-400 shrink-0">{{ t.code }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
            <span class="text-xs text-stone-500 truncate">Revenue {{ formatIDR(t.revenue_idr) }}</span>
            <span class="font-semibold tabular-nums shrink-0" :class="t.profit_idr >= 0 ? 'text-success' : 'text-error'">{{ formatIDR(t.profit_idr) }}</span>
          </div>
        </div>
        <p v-if="!(pnl?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
      </div>
    </div>
  </div>
</template>
