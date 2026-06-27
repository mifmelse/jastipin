<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['customer_addresses']['Row']

const { can } = useCan()
const props = defineProps<{ customerId: string }>()
const { items, create, update, remove } = useCustomerAddresses(props.customerId)
const { items: countries } = useCountries()
const toast = useToast()

const countryOptions = computed(() => [
  { label: '— none —', value: NONE },
  ...(countries.value ?? []).map((c) => ({ label: c.name, value: c.id })),
])

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  label: '',
  recipient_name: '',
  recipient_phone: '',
  address_line: '',
  city: '',
  postal_code: '',
  country_id: NONE,
  notes: '',
})

function reset() {
  Object.assign(form, {
    label: '', recipient_name: '', recipient_phone: '', address_line: '',
    city: '', postal_code: '', country_id: NONE, notes: '',
  })
}
function openCreate() {
  editing.value = null
  reset()
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    label: row.label ?? '',
    recipient_name: row.recipient_name ?? '',
    recipient_phone: row.recipient_phone ?? '',
    address_line: row.address_line ?? '',
    city: row.city ?? '',
    postal_code: row.postal_code ?? '',
    country_id: fromNullable(row.country_id),
    notes: row.notes ?? '',
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      customer_id: props.customerId,
      label: form.label.trim() || null,
      recipient_name: form.recipient_name.trim() || null,
      recipient_phone: form.recipient_phone.trim() || null,
      address_line: form.address_line.trim() || null,
      city: form.city.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country_id: toNullable(form.country_id),
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
  if (!(await useConfirm().confirm({ title: 'Hapus alamat', description: `Hapus alamat "${row.label || row.recipient_name || '—'}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UButton v-if="can('crm.write')" size="sm" icon="i-lucide-plus" @click="openCreate">Tambah alamat</UButton>
    </div>

    <div v-if="items?.length" class="space-y-2">
      <div
        v-for="row in items"
        :key="row.id"
        class="rounded-lg border border-stone-200 dark:border-stone-800 p-3 flex items-start justify-between gap-3"
      >
        <div class="min-w-0 text-sm">
          <div class="flex items-center gap-2">
            <UBadge v-if="row.label" color="primary" variant="soft">{{ row.label }}</UBadge>
            <span class="font-medium">{{ row.recipient_name ?? '—' }}</span>
            <span v-if="row.recipient_phone" class="text-stone-500">· {{ row.recipient_phone }}</span>
          </div>
          <p class="text-stone-500 mt-1">{{ row.address_line ?? '—' }}</p>
          <p class="text-stone-400 text-xs">
            {{ [row.city, row.postal_code, row.countries?.name].filter(Boolean).join(', ') || '—' }}
          </p>
        </div>
        <div class="flex gap-1 shrink-0">
          <UButton v-if="can('crm.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
          <UButton v-if="can('crm.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-stone-400 py-6 text-center rounded-lg border border-dashed border-stone-200 dark:border-stone-800">
      Belum ada alamat.
    </p>

    <UModal v-model:open="open" :title="editing ? 'Edit Alamat' : 'Tambah Alamat'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Label" help="mis. Rumah, Kantor">
              <UInput v-model="form.label" class="w-full" />
            </UFormField>
            <UFormField label="Recipient name">
              <UInput v-model="form.recipient_name" class="w-full" />
            </UFormField>
            <UFormField label="Recipient phone">
              <UInput v-model="form.recipient_phone" class="w-full" />
            </UFormField>
            <UFormField label="Country">
              <USelect v-model="form.country_id" :items="countryOptions" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Address">
            <UTextarea v-model="form.address_line" class="w-full" :rows="2" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="City">
              <UInput v-model="form.city" class="w-full" />
            </UFormField>
            <UFormField label="Postal code">
              <UInput v-model="form.postal_code" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
