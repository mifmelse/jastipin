<script setup lang="ts">
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
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Orders</h1>
        <p class="text-sm text-stone-500">Transaksi inti — 1 customer untuk 1 leg.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Code</th>
            <th class="px-3 py-2 font-medium">Customer</th>
            <th class="px-3 py-2 font-medium">Leg</th>
            <th class="px-3 py-2 font-medium text-right">Items</th>
            <th class="px-3 py-2 font-medium text-right">Total</th>
            <th class="px-3 py-2 font-medium">Status</th>
            <th class="px-3 py-2 w-16"></th>
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
            <td class="px-3 py-2 text-right tabular-nums">{{ formatIDR(row.total_idr) }}</td>
            <td class="px-3 py-2">
              <UBadge :color="orderStatusColor(row.status)" variant="soft" class="capitalize">
                {{ row.status.replace('_', ' ') }}
              </UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus order" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada order.</td>
          </tr>
        </tbody>
      </table>
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
