<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['trip_expenses']['Row']

const { can } = useCan()
const props = defineProps<{ tripId: string }>()
const { items, create, update, remove } = useTripExpenses(props.tripId)
const toast = useToast()

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  category: '',
  description: '',
  amount: '' as number | '',
  currency: 'IDR',
  fx_rate: 1 as number | '',
  spent_at: '',
  receipt_url: '',
})

function reset() {
  Object.assign(form, { category: '', description: '', amount: '', currency: 'IDR', fx_rate: 1, spent_at: '', receipt_url: '' })
}
function openCreate() {
  editing.value = null
  reset()
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    category: row.category,
    description: row.description ?? '',
    amount: row.amount,
    currency: row.currency,
    fx_rate: row.fx_rate,
    spent_at: row.spent_at ?? '',
    receipt_url: row.receipt_url ?? '',
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      trip_id: props.tripId,
      category: form.category.trim(),
      description: form.description.trim() || null,
      amount: Number(form.amount) || 0,
      currency: form.currency || 'IDR',
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      spent_at: form.spent_at || null,
      receipt_url: form.receipt_url.trim() || null,
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
  if (!(await useConfirm().confirm({ title: 'Hapus expense', description: `Hapus "${row.category}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

// Total in the base currency (IDR) = Σ amount × fx_rate.
const total = computed(() =>
  (items.value ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0) * Number(r.fx_rate ?? 1), 0),
)
const valid = computed(() => form.category.trim() && Number(form.amount) > 0)
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UButton v-if="can('trips.write')" icon="i-lucide-plus" @click="openCreate">Tambah expense</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Date</th>
            <th class="px-3 py-2 font-medium">Category</th>
            <th class="px-3 py-2 font-medium">Description</th>
            <th class="px-3 py-2 font-medium text-right">Amount</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 text-stone-500">{{ row.spent_at ?? '—' }}</td>
            <td class="px-3 py-2 font-medium">{{ row.category }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.description ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">
              {{ row.currency }} {{ Number(row.amount).toLocaleString('id-ID') }}
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('trips.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('trips.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="5" class="px-3 py-6 text-center text-stone-400">Belum ada expense.</td>
          </tr>
        </tbody>
        <tfoot v-if="items?.length" class="border-t border-stone-200 dark:border-stone-800">
          <tr>
            <td colspan="3" class="px-3 py-2 text-right text-stone-500">Total (IDR)</td>
            <td class="px-3 py-2 text-right font-medium tabular-nums">Rp {{ total.toLocaleString('id-ID') }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Expense' : 'Tambah Expense'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Category" required>
              <UInput v-model="form.category" class="w-full" placeholder="transport, makan, …" />
            </UFormField>
            <UFormField label="Spent at">
              <UInput v-model="form.spent_at" type="date" class="w-full" />
            </UFormField>
          </div>
          <MoneyInput v-model:amount="form.amount" v-model:currency="form.currency" v-model:fx-rate="form.fx_rate" />
          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="2" />
          </UFormField>
          <UFormField label="Receipt" help="Foto/PDF struk.">
            <FileUpload v-model="form.receipt_url" folder="receipts" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!valid" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
