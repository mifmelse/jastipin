<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['trip_bookings']['Row']

const { can } = useCan()
const props = defineProps<{ tripId: string }>()
const { items, create, update, remove } = useTripBookings(props.tripId)
const toast = useToast()

const TYPE_OPTIONS = [
  { label: 'Flight', value: 'flight' },
  { label: 'Hotel', value: 'hotel' },
  { label: 'Transport', value: 'transport' },
  { label: 'Other', value: 'other' },
]

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  type: 'flight',
  title: '',
  reference_no: '',
  date: '',
  amount: '' as number | '',
  currency: 'IDR',
  fx_rate: 1 as number | '',
  notes: '',
})

function reset() {
  Object.assign(form, { type: 'flight', title: '', reference_no: '', date: '', amount: '', currency: 'IDR', fx_rate: 1, notes: '' })
}
function openCreate() {
  editing.value = null
  reset()
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    type: row.type,
    title: row.title,
    reference_no: row.reference_no ?? '',
    date: row.date ?? '',
    amount: row.amount ?? '',
    currency: row.currency,
    fx_rate: row.fx_rate,
    notes: row.notes ?? '',
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      trip_id: props.tripId,
      type: form.type,
      title: form.title.trim(),
      reference_no: form.reference_no.trim() || null,
      date: form.date || null,
      amount: form.amount === '' ? null : Number(form.amount),
      currency: form.currency || 'IDR',
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      notes: form.notes.trim() || null,
    }
    if (editing.value) await update(editing.value.id, payload)
    else await create(payload)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: Row) {
  if (!(await useConfirm().confirm({ title: 'Hapus booking', description: `Hapus "${row.title}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <FabAdd label="Tambah booking" @click="openCreate" />

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Type</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Title</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Date</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Amount</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Ref</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2"><UBadge color="neutral" variant="soft">{{ row.type }}</UBadge></td>
            <td class="px-3 py-2 font-medium">{{ row.title }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.date ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">
              {{ row.amount != null ? `${row.currency} ${Number(row.amount).toLocaleString('id-ID')}` : '—' }}
            </td>
            <td class="px-3 py-2 font-mono text-xs text-stone-500">{{ row.reference_no ?? '—' }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('trips.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('trips.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada booking.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.title }}</span>
            <span v-if="row.reference_no" class="font-mono text-xs text-stone-400 shrink-0">{{ row.reference_no }}</span>
          </div>
          <UBadge color="neutral" variant="soft" class="shrink-0">{{ row.type }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.date ?? '—' }}</span>
          <span class="font-semibold text-primary tabular-nums shrink-0">
            {{ row.amount != null ? `${row.currency} ${Number(row.amount).toLocaleString('id-ID')}` : '—' }}
          </span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada booking.</p>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Booking' : 'Tambah Booking'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Type" required>
              <USelect v-model="form.type" :items="TYPE_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Title" required>
              <UInput v-model="form.title" class="w-full" />
            </UFormField>
            <UFormField label="Reference no">
              <UInput v-model="form.reference_no" class="w-full" />
            </UFormField>
            <UFormField label="Date">
              <UInput v-model="form.date" type="date" class="w-full" />
            </UFormField>
          </div>
          <MoneyInput v-model:amount="form.amount" v-model:currency="form.currency" v-model:fx-rate="form.fx_rate" />
          <UFormField label="Notes">
            <UTextarea v-model="form.notes" class="w-full" :rows="2" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.title.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
