<script setup lang="ts">
const { can } = useCan()
const { items, remove } = useOrders()
const { items: customers } = useCustomers()
const { items: legs } = useAllLegs()
const { items: currencies } = useCurrencies()
const toast = useToast()
const router = useRouter()
const route = useRoute()

type OrderRow = {
  id: string
  code: string | null
  status: string
  total_idr: number | null
  item_count: number | null
  customers?: { name: string } | null
  trip_route?: LegEmbed
}

const customerOptions = computed(() => (customers.value ?? []).map((c) => ({ label: c.name, value: c.id })))
const legOptions = computed(() =>
  (legs.value ?? []).map((l) => ({ label: legLabel(l as LegEmbed), value: l.id })),
)
const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

// --- create ---
const open = ref(false)
const saving = ref(false)
const form = reactive({ customer_id: '', trip_route_id: '', currency: 'IDR', fx_rate: 1 as number | '' })
const isForeign = computed(() => form.currency !== 'IDR')
watch(() => form.currency, (c) => {
  if (c === 'IDR') form.fx_rate = 1
})
const canSave = computed(() => !!form.customer_id && !!form.trip_route_id)

function openCreate() {
  Object.assign(form, { customer_id: '', trip_route_id: '', currency: 'IDR', fx_rate: 1 })
  open.value = true
}
// command-palette quick action: /operations/orders?new=1
useAutoOpen('new', openCreate)

async function save() {
  saving.value = true
  try {
    const { create } = useOrders()
    const created = await create({
      customer_id: form.customer_id,
      trip_route_id: form.trip_route_id,
      currency: form.currency,
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
    })
    open.value = false
    if (created?.id) router.push(`/operations/orders/${created.id}`)
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function onDelete(row: OrderRow) {
  if (!(await useConfirm().confirm({ title: 'Hapus order', description: `Hapus "${row.code}"? Item-nya ikut terhapus.` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

// --- CRM → Order handoff: ?customer=&trip= prefill the create modal ---
onMounted(() => {
  if (route.query.customer) {
    openCreate()
    form.customer_id = String(route.query.customer)
  }
})
// Once legs load, preselect the first leg of the handoff trip.
watch(legs, (list) => {
  const tripId = route.query.trip ? String(route.query.trip) : null
  if (tripId && list && !form.trip_route_id) {
    const leg = list.find((l) => l.trip_id === tripId)
    if (leg) form.trip_route_id = leg.id
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Orders" subtitle="Transaksi inti — 1 customer untuk 1 leg." icon="i-lucide-shopping-cart">
      <template #actions>
        <UButton v-if="can('orders.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Code</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Customer</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Leg</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Items</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Total</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr
            v-for="row in (items as OrderRow[]) ?? []"
            :key="row.id"
            class="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
            @click="router.push(`/operations/orders/${row.id}`)"
          >
            <td class="px-3 py-2 font-mono text-xs">{{ row.code }}</td>
            <td class="px-3 py-2 font-medium">{{ row.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ legLabel(row.trip_route ?? null) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ row.item_count ?? 0 }}</td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">{{ formatIDR(row.total_idr) }}</td>
            <td class="px-3 py-2">
              <UBadge :color="orderStatusColor(row.status)" variant="soft" class="capitalize">
                {{ row.status.replace('_', ' ') }}
              </UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton v-if="can('orders.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus order" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada order.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mobile: cards instead of a cramped table -->
    <div class="md:hidden space-y-2">
      <button
        v-for="row in (items as OrderRow[]) ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
        @click="router.push(`/operations/orders/${row.id}`)"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.customers?.name ?? '—' }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ row.code }}</span>
          </div>
          <UBadge :color="orderStatusColor(row.status)" variant="soft" class="capitalize shrink-0">
            {{ row.status.replace('_', ' ') }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate inline-flex items-center gap-1">
            <UIcon name="i-lucide-plane" class="size-3.5 shrink-0" />{{ legLabel(row.trip_route ?? null) }}
          </span>
          <span class="font-semibold text-primary tabular-nums shrink-0">{{ formatIDR(row.total_idr) }}</span>
        </div>
      </button>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada order.</p>
    </div>

    <UModal v-model:open="open" title="Tambah Order">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Customer" required>
            <USelect v-model="form.customer_id" :items="customerOptions" class="w-full" placeholder="Pilih customer…" />
          </UFormField>
          <UFormField label="Leg (trip route)" required help="Order menempel ke leg, bukan trip.">
            <USelect v-model="form.trip_route_id" :items="legOptions" class="w-full" placeholder="Pilih leg…" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Currency">
              <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
            </UFormField>
            <UFormField v-if="isForeign" label="Kurs → IDR" help="1 unit = ? IDR">
              <UInput v-model.number="form.fx_rate" type="number" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canSave" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
