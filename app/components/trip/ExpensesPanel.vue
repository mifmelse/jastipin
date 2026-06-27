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
    <FabAdd label="Tambah expense" @click="openCreate" />

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Date</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Category</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Description</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Amount</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 text-stone-500">{{ row.spent_at ?? '—' }}</td>
            <td class="px-3 py-2 font-medium">{{ row.category }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.description ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">
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

    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.category }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ row.spent_at ?? '—' }}</span>
          </div>
          <span class="font-semibold text-primary tabular-nums shrink-0">
            {{ row.currency }} {{ Number(row.amount).toLocaleString('id-ID') }}
          </span>
        </div>
        <div v-if="row.description" class="border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.description }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada expense.</p>
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
