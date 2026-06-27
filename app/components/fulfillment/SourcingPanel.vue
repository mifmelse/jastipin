<script setup lang="ts">
import type { Database } from '~/types/database.types'

type SourcingRecord = Database['public']['Tables']['sourcing_records']['Row']
type Row = {
  id: string
  qty: number
  item_name: string | null
  requested_price: number | null
  status: string
  products?: { name: string } | null
  orders?: { code: string | null; customers?: { name: string } | null } | null
  sourcing_records?: SourcingRecord | null
}

const filterLeg = ref(NONE)
const legId = computed(() => toNullable(filterLeg.value))
const { items, save } = useSourcingQueue(legId)
const { items: legs } = useAllLegs()
const { items: currencies } = useCurrencies()
const user = useSupabaseUser()
const toast = useToast()

const legOptions = computed(() => [
  { label: 'Semua leg', value: NONE },
  ...(legs.value ?? []).map((l) => ({ label: legLabel(l as LegEmbed), value: l.id })),
])
const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

const itemLabel = (r: Row) => r.products?.name ?? r.item_name ?? '(item)'
const recTotal = (r: Row) => {
  const s = r.sourcing_records
  if (!s || s.actual_price == null) return null
  return Number(s.actual_price) * r.qty * Number(s.fx_rate ?? 1)
}
const fmtIDR = (n: number | null) => (n == null ? '—' : `Rp ${Math.round(n).toLocaleString('id-ID')}`)

// --- record modal ---
const open = ref(false)
const saving = ref(false)
const active = ref<Row | null>(null)
const form = reactive({
  status: 'pending',
  store_name: '',
  purchased_at: '',
  actual_price: '' as number | '',
  currency: 'IDR',
  fx_rate: 1 as number | '',
  is_substitute: false,
  substitute_note: '',
  receipt_url: '',
  note: '',
})
const isForeign = computed(() => form.currency !== 'IDR')
watch(() => form.currency, (c) => {
  if (c === 'IDR') form.fx_rate = 1
})
const previewTotal = computed(() => {
  if (form.actual_price === '' || !active.value) return null
  return Number(form.actual_price) * active.value.qty * Number(form.fx_rate || 1)
})

function openRecord(r: Row) {
  active.value = r
  const s = r.sourcing_records
  Object.assign(form, {
    status: s?.status ?? (r.status === 'pending' ? 'sourcing' : r.status),
    store_name: s?.store_name ?? '',
    purchased_at: s?.purchased_at ? s.purchased_at.slice(0, 10) : '',
    actual_price: s?.actual_price ?? '',
    currency: s?.currency ?? 'IDR',
    fx_rate: s?.fx_rate ?? 1,
    is_substitute: s?.is_substitute ?? false,
    substitute_note: s?.substitute_note ?? '',
    receipt_url: s?.receipt_url ?? '',
    note: s?.note ?? '',
  })
  open.value = true
}

const num = (v: number | '') => (v === '' ? null : Number(v))

async function submit() {
  if (!active.value) return
  saving.value = true
  try {
    await save(active.value.id, {
      shopper_id: user.value?.id ?? null,
      status: form.status,
      store_name: form.store_name.trim() || null,
      purchased_at: form.purchased_at || null,
      actual_price: num(form.actual_price),
      currency: form.currency,
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      is_substitute: form.is_substitute,
      substitute_note: form.substitute_note.trim() || null,
      receipt_url: form.receipt_url || null,
      note: form.note.trim() || null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <span class="text-sm text-stone-500">Leg</span>
      <USelect v-model="filterLeg" :items="legOptions" class="w-72" />
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Order</th>
            <th class="px-3 py-2 font-medium">Customer</th>
            <th class="px-3 py-2 font-medium">Item</th>
            <th class="px-3 py-2 font-medium text-right">Qty</th>
            <th class="px-3 py-2 font-medium">Status</th>
            <th class="px-3 py-2 font-medium">Toko</th>
            <th class="px-3 py-2 font-medium text-right">Modal (IDR)</th>
            <th class="px-3 py-2 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="r in (items as Row[]) ?? []" :key="r.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ r.orders?.code }}</td>
            <td class="px-3 py-2">{{ r.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2">
              <div class="font-medium">{{ itemLabel(r) }}</div>
              <div v-if="r.sourcing_records?.is_substitute" class="text-xs text-warning">substitusi</div>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">{{ r.qty }}</td>
            <td class="px-3 py-2">
              <UBadge :color="itemStatusColor(r.status)" variant="soft" class="capitalize">
                {{ r.status.replace('_', ' ') }}
              </UBadge>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ r.sourcing_records?.store_name ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ fmtIDR(recTotal(r)) }}</td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-pencil" @click="openRecord(r)">Catat</UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="8" class="px-3 py-6 text-center text-stone-400">Tidak ada item sourcing.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="active ? `Sourcing — ${itemLabel(active)}` : 'Sourcing'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <p class="text-xs text-stone-500">
            {{ active.orders?.code }} · {{ active.orders?.customers?.name }} · qty {{ active.qty }}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Status">
              <USelect v-model="form.status" :items="SOURCING_STATUS_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Toko">
              <UInput v-model="form.store_name" class="w-full" placeholder="mis. Don Quijote" />
            </UFormField>
            <UFormField label="Tgl beli">
              <UInput v-model="form.purchased_at" type="date" class="w-full" />
            </UFormField>
            <UFormField :label="`Harga aktual / unit (${form.currency})`">
              <UInput v-model.number="form.actual_price" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Currency">
              <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
            </UFormField>
            <UFormField v-if="isForeign" label="Kurs → IDR" help="1 unit = ? IDR">
              <UInput v-model.number="form.fx_rate" type="number" class="w-full" />
            </UFormField>
          </div>

          <p v-if="previewTotal !== null" class="text-sm">
            Modal belanja: <span class="font-semibold">Rp {{ Math.round(previewTotal).toLocaleString('id-ID') }}</span>
            <span class="text-stone-400 text-xs"> ({{ form.actual_price }} × {{ active.qty }}<span v-if="isForeign"> × {{ form.fx_rate }}</span>)</span>
          </p>

          <UFormField label="Substitusi">
            <div class="flex items-center gap-2">
              <USwitch v-model="form.is_substitute" />
              <span class="text-sm text-stone-500">Barang pengganti (asli tidak ada)</span>
            </div>
          </UFormField>
          <UFormField v-if="form.is_substitute" label="Catatan substitusi">
            <UInput v-model="form.substitute_note" class="w-full" placeholder="diganti dengan…" />
          </UFormField>

          <UFormField label="Struk / nota">
            <FileUpload v-model="form.receipt_url" folder="receipts" />
          </UFormField>
          <UFormField label="Catatan">
            <UInput v-model="form.note" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" @click="submit">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
