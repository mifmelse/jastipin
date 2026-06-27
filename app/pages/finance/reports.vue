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
    <div>
      <h1 class="text-xl font-semibold">Reports</h1>
      <p class="text-sm text-stone-500">Cashflow, piutang/hutang, dan profit per trip.</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div v-for="k in kpis" :key="k.label" class="rounded-lg border border-stone-200 dark:border-stone-800 p-3">
        <p class="text-xs text-stone-500">{{ k.label }}</p>
        <p class="text-lg font-semibold tabular-nums mt-1" :class="k.color">{{ formatIDR(k.value) }}</p>
      </div>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Profit per trip</h2>
      <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
            <tr>
              <th class="px-3 py-2 font-medium">Trip</th>
              <th class="px-3 py-2 font-medium text-right">Revenue</th>
              <th class="px-3 py-2 font-medium text-right">Modal/biaya</th>
              <th class="px-3 py-2 font-medium text-right">Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
            <tr v-for="t in (pnl as Pnl[]) ?? []" :key="t.trip_id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
              <td class="px-3 py-2">
                <span class="font-mono text-xs text-stone-400 mr-1">{{ t.code }}</span>{{ t.name }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ formatIDR(t.revenue_idr) }}</td>
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
    </div>
  </div>
</template>
