<script setup lang="ts">
import type { Period } from '~/composables/usePeriodCash'

type OrderRow = { status: string }
type Ar = { paid_idr: number; outstanding_idr: number }
type Payable = { amount_idr: number; status: string }
type Pnl = { trip_id: string; code: string | null; name: string; revenue_idr: number; cost_idr: number; profit_idr: number }
type Trip = { id: string; code: string | null; name: string; status: string; trip_routes?: { count: number }[] }

const { items: trips } = useTrips()
const { items: orders } = useOrders()
const { items: ar } = useReceivables()
const { items: payables } = usePayables()
const { items: pnl } = useTripPnl()
const { queues } = useWorkQueues()

const period = ref<Period>('this_month')
const { data: periodCash } = usePeriodCash(period)

const sum = (arr: number[]) => arr.reduce((a, b) => a + Number(b || 0), 0)

const activeTrips = computed(() => ((trips.value as Trip[]) ?? []).filter((t) => ['planned', 'ongoing'].includes(t.status)))
const pendingOrders = computed(() => ((orders.value as OrderRow[]) ?? []).filter((o) => !['completed', 'cancelled', 'refunded'].includes(o.status)))

const cashIn = computed(() => sum(((ar.value as Ar[]) ?? []).map((r) => r.paid_idr)))
const cashOut = computed(() => sum(((payables.value as Payable[]) ?? []).filter((p) => p.status === 'paid').map((p) => p.amount_idr)))
const netCash = computed(() => cashIn.value - cashOut.value)
const arOutstanding = computed(() => sum(((ar.value as Ar[]) ?? []).map((r) => r.outstanding_idr)))
const apUnpaid = computed(() => sum(((payables.value as Payable[]) ?? []).filter((p) => p.status === 'unpaid').map((p) => p.amount_idr)))

const kpis = computed(() => [
  { label: 'Trip aktif', value: String(activeTrips.value.length), to: '/operations/trips' },
  { label: 'Order berjalan', value: String(pendingOrders.value.length), to: '/operations/orders' },
  { label: 'Kas bersih', value: formatIDR(netCash.value), to: '/finance/reports', tone: netCash.value >= 0 ? 'text-success' : 'text-error' },
  { label: 'Piutang (AR)', value: formatIDR(arOutstanding.value), to: '/finance/receivables', tone: 'text-warning' },
  { label: 'Hutang (AP)', value: formatIDR(apUnpaid.value), to: '/finance/payables', tone: 'text-warning' },
])

// order pipeline breakdown (non-terminal statuses, in flow order)
const orderFlow = ['draft', 'confirmed', 'paid', 'fulfilling', 'packed', 'in_transit', 'delivered']
const orderByStatus = computed(() => {
  const m = new Map<string, number>()
  for (const o of pendingOrders.value) m.set(o.status, (m.get(o.status) ?? 0) + 1)
  return orderFlow.map((s) => ({ status: s, count: m.get(s) ?? 0 })).filter((x) => x.count > 0)
})

const legCount = (t: Trip) => t.trip_routes?.[0]?.count ?? 0
const topTrips = computed(() => ((pnl.value as Pnl[]) ?? []).slice(0, 5))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Dashboard" subtitle="Ringkasan operasi & keuangan jastip." icon="i-lucide-layout-dashboard" />

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <NuxtLink
        v-for="k in kpis"
        :key="k.label"
        :to="k.to"
        class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 hover:border-primary/50 transition-colors"
      >
        <p class="text-xs text-stone-500">{{ k.label }}</p>
        <p class="text-lg font-semibold tabular-nums mt-1" :class="k.tone">{{ k.value }}</p>
      </NuxtLink>
    </div>

    <section v-if="queues.length" class="space-y-2">
      <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Antrian kerja</h2>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <NuxtLink
          v-for="q in queues"
          :key="q.key"
          :to="q.to"
          class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 flex items-center gap-3 hover:border-primary/50 transition-colors"
        >
          <div class="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UIcon :name="q.icon" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="text-lg font-semibold tabular-nums leading-tight">{{ q.count }}</p>
            <p class="text-xs text-stone-500 truncate">{{ q.label }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Kas</h2>
        <USelect v-model="period" :items="PERIOD_OPTIONS" size="sm" class="w-44" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p class="text-xs text-stone-500">Masuk</p>
          <p class="text-base sm:text-lg font-semibold tabular-nums text-success mt-1">{{ formatIDR(periodCash?.cashIn ?? 0) }}</p>
        </div>
        <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p class="text-xs text-stone-500">Keluar</p>
          <p class="text-base sm:text-lg font-semibold tabular-nums text-error mt-1">{{ formatIDR(periodCash?.cashOut ?? 0) }}</p>
        </div>
        <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p class="text-xs text-stone-500">Bersih</p>
          <p class="text-base sm:text-lg font-semibold tabular-nums mt-1" :class="(periodCash?.netCash ?? 0) >= 0 ? 'text-success' : 'text-error'">{{ formatIDR(periodCash?.netCash ?? 0) }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Order berjalan</h2>
        <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
          <NuxtLink
            v-for="s in orderByStatus"
            :key="s.status"
            to="/operations/orders"
            class="flex items-center justify-between px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-900/50"
          >
            <UBadge :color="orderStatusColor(s.status)" variant="soft" class="capitalize">{{ s.status.replace('_', ' ') }}</UBadge>
            <span class="tabular-nums font-medium">{{ s.count }}</span>
          </NuxtLink>
          <p v-if="!orderByStatus.length" class="px-3 py-6 text-center text-sm text-stone-400">Tidak ada order berjalan.</p>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Trip aktif</h2>
        <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
          <NuxtLink
            v-for="t in activeTrips"
            :key="t.id"
            :to="`/operations/trips/${t.id}`"
            class="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-900/50"
          >
            <span class="min-w-0 truncate">
              <span class="font-mono text-xs text-stone-400 mr-1">{{ t.code }}</span>{{ t.name }}
            </span>
            <span class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-stone-400">{{ legCount(t) }} route</span>
              <UBadge :color="tripStatusColor(t.status)" variant="soft" class="capitalize">{{ t.status }}</UBadge>
            </span>
          </NuxtLink>
          <p v-if="!activeTrips.length" class="px-3 py-6 text-center text-sm text-stone-400">Tidak ada trip aktif.</p>
        </div>
      </section>
    </div>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Profit per trip</h2>
        <NuxtLink to="/finance/reports" class="text-xs text-primary hover:underline">Lihat semua →</NuxtLink>
      </div>
      <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
            <tr>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Trip</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Revenue</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Biaya</th>
              <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
            <tr v-for="t in topTrips" :key="t.trip_id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
              <td class="px-3 py-2"><span class="font-mono text-xs text-stone-400 mr-1">{{ t.code }}</span>{{ t.name }}</td>
              <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">{{ formatIDR(t.revenue_idr) }}</td>
              <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ formatIDR(t.cost_idr) }}</td>
              <td class="px-3 py-2 text-right tabular-nums font-medium" :class="t.profit_idr >= 0 ? 'text-success' : 'text-error'">{{ formatIDR(t.profit_idr) }}</td>
            </tr>
            <tr v-if="!topTrips.length">
              <td colspan="4" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-2">
        <div
          v-for="t in topTrips"
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
        <p v-if="!topTrips.length" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
      </div>
    </section>
  </div>
</template>
