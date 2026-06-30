<script setup lang="ts">
type Payable = {
  source_type: string
  source_id: string
  trip_id: string | null
  amount_idr: number
  currency: string
  amount_src: number
  incurred_at: string | null
  description: string
  status: string
}

const { can } = useCan()
const { items, settle, unsettle, addManual, removeManual } = usePayables()
const { items: trips } = useTrips()
const { items: currencies } = useCurrencies()
const user = useSupabaseUser()
const toast = useToast()

const filterStatus = ref(NONE)
const filterSource = ref(NONE)
const statusOptions = [{ label: 'Semua status', value: NONE }, { label: 'Unpaid', value: 'unpaid' }, { label: 'Paid', value: 'paid' }]
const sourceOptions = [
  { label: 'Semua sumber', value: NONE },
  ...Object.entries(PAYABLE_SOURCE_LABEL).map(([value, label]) => ({ label, value })),
]
const rows = computed(() => {
  let list = (items.value as Payable[]) ?? []
  const st = toNullable(filterStatus.value)
  const sc = toNullable(filterSource.value)
  if (st) list = list.filter((p) => p.status === st)
  if (sc) list = list.filter((p) => p.source_type === sc)
  return list
})
const totalUnpaid = computed(() => rows.value.filter((p) => p.status === 'unpaid').reduce((a, p) => a + Number(p.amount_idr), 0))

const tripOptions = computed(() => [
  { label: '— tanpa trip —', value: NONE },
  ...(trips.value ?? []).map((t) => ({ label: t.code ? `${t.code} · ${t.name}` : t.name, value: t.id })),
])
const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

async function toggle(p: Payable) {
  try {
    if (p.status === 'paid') await unsettle(p.source_type, p.source_id)
    else await settle(p.source_type, p.source_id, null)
  } catch (e) {
    toast.add({ title: 'Gagal update', description: (e as Error).message, color: 'error' })
  }
}
async function onRemoveManual(p: Payable) {
  if (!(await useConfirm().confirm({ title: 'Hapus payable', description: `Hapus "${p.description}"?` }))) return
  try {
    await removeManual(p.source_id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

// --- manual payable ---
const open = ref(false)
const saving = ref(false)
const form = reactive({ description: '', category: '', amount: '' as number | '', currency: 'IDR', fx_rate: 1 as number | '', incurred_at: '', trip_id: NONE })
const isForeign = computed(() => form.currency !== 'IDR')
watch(() => form.currency, (c) => { if (c === 'IDR') form.fx_rate = 1 })

function openManual() {
  Object.assign(form, { description: '', category: '', amount: '', currency: 'IDR', fx_rate: 1, incurred_at: new Date().toISOString().slice(0, 10), trip_id: NONE })
  open.value = true
}
async function saveManual() {
  if (!form.description.trim() || form.amount === '') return
  saving.value = true
  try {
    await addManual({
      description: form.description.trim(),
      category: form.category.trim() || null,
      amount: Number(form.amount),
      currency: form.currency,
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      incurred_at: form.incurred_at || null,
      trip_id: toNullable(form.trip_id),
      recorded_by: user.value?.id ?? null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Payables" subtitle="Modal keluar — sourcing, ongkir, biaya trip, lainnya. Ledger live (anti double-count)." icon="i-lucide-arrow-up-right">
      <template #actions>
        <UButton v-if="can('payables.write')" icon="i-lucide-plus" @click="openManual">Tambah manual</UButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-3">
      <USelect v-model="filterStatus" :items="statusOptions" class="w-40" />
      <USelect v-model="filterSource" :items="sourceOptions" class="w-40" />
      <span class="text-sm text-stone-500 ml-auto">Belum dibayar: <span class="font-semibold text-warning">{{ formatIDR(totalUnpaid) }}</span></span>
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Sumber</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Deskripsi</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Tanggal</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Nilai</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-32"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="p in rows" :key="`${p.source_type}:${p.source_id}`" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2">
              <UBadge :color="payableSourceColor(p.source_type)" variant="soft">{{ PAYABLE_SOURCE_LABEL[p.source_type] ?? p.source_type }}</UBadge>
            </td>
            <td class="px-3 py-2">{{ p.description }}</td>
            <td class="px-3 py-2 text-stone-500">{{ fmtDate(p.incurred_at) }}</td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">
              {{ formatIDR(p.amount_idr) }}
              <span v-if="p.currency !== 'IDR'" class="block text-xs text-stone-400">{{ p.currency }} {{ Number(p.amount_src).toLocaleString('id-ID') }}</span>
            </td>
            <td class="px-3 py-2">
              <UBadge :color="p.status === 'paid' ? 'success' : 'neutral'" variant="soft" class="capitalize">{{ p.status }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end gap-1">
                <UButton v-if="can('payables.write')" size="xs" :color="p.status === 'paid' ? 'neutral' : 'success'" variant="soft" @click="toggle(p)">
                  {{ p.status === 'paid' ? 'Batalkan' : 'Tandai lunas' }}
                </UButton>
                <UButton v-if="p.source_type === 'other' && can('payables.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus" @click="onRemoveManual(p)" />
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Tidak ada payable.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="p in rows"
        :key="`${p.source_type}:${p.source_id}`"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ p.description }}</span>
          </div>
          <UBadge :color="p.status === 'paid' ? 'success' : 'neutral'" variant="soft" class="capitalize shrink-0">{{ p.status }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate inline-flex items-center gap-2">
            <UBadge :color="payableSourceColor(p.source_type)" variant="soft" size="xs">{{ PAYABLE_SOURCE_LABEL[p.source_type] ?? p.source_type }}</UBadge>
            {{ fmtDate(p.incurred_at) }}
          </span>
          <span class="font-semibold text-primary tabular-nums shrink-0">{{ formatIDR(p.amount_idr) }}</span>
        </div>
      </div>
      <p v-if="!rows.length" class="text-center text-stone-400 text-sm py-6">Tidak ada payable.</p>
    </div>

    <UModal v-model:open="open" title="Tambah Payable Manual">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Deskripsi" required>
            <UInput v-model="form.description" class="w-full" placeholder="mis. Sewa packing, fee admin" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Kategori">
              <UInput v-model="form.category" class="w-full" />
            </UFormField>
            <UFormField label="Trip">
              <USelect v-model="form.trip_id" :items="tripOptions" class="w-full" />
            </UFormField>
            <UFormField label="Jumlah" required>
              <UInput v-model.number="form.amount" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Currency">
              <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
            </UFormField>
            <UFormField v-if="isForeign" label="Kurs → IDR">
              <UInput v-model.number="form.fx_rate" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal">
              <UInput v-model="form.incurred_at" type="date" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.description.trim() || form.amount === ''" @click="saveManual">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
