<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['luggage_types']['Row']

const { can } = useCan()
const { items, create, update, remove } = useLuggageTypes()
const toast = useToast()

const CATEGORY_OPTIONS = [
  { label: 'Checked', value: 'checked' },
  { label: 'Cabin', value: 'cabin' },
  { label: 'Personal', value: 'personal' },
]

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  name: '',
  category: 'checked',
  max_weight_g: 0,
  tare_weight_g: 0,
  max_volume_cm3: '' as number | '',
  inner_length_mm: '' as number | '',
  inner_width_mm: '' as number | '',
  inner_height_mm: '' as number | '',
  regulation_note: '',
  is_active: true,
})

const numOrNull = (v: number | '') => (v === '' ? null : Number(v))

function openCreate() {
  editing.value = null
  Object.assign(form, {
    name: '', category: 'checked', max_weight_g: 0, tare_weight_g: 0,
    max_volume_cm3: '', inner_length_mm: '', inner_width_mm: '', inner_height_mm: '',
    regulation_note: '', is_active: true,
  })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    category: row.category,
    max_weight_g: row.max_weight_g,
    tare_weight_g: row.tare_weight_g,
    max_volume_cm3: row.max_volume_cm3 ?? '',
    inner_length_mm: row.inner_length_mm ?? '',
    inner_width_mm: row.inner_width_mm ?? '',
    inner_height_mm: row.inner_height_mm ?? '',
    regulation_note: row.regulation_note ?? '',
    is_active: row.is_active,
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      max_weight_g: Number(form.max_weight_g) || 0,
      tare_weight_g: Number(form.tare_weight_g) || 0,
      max_volume_cm3: numOrNull(form.max_volume_cm3),
      inner_length_mm: numOrNull(form.inner_length_mm),
      inner_width_mm: numOrNull(form.inner_width_mm),
      inner_height_mm: numOrNull(form.inner_height_mm),
      regulation_note: form.regulation_note.trim() || null,
      is_active: form.is_active,
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
  if (!(await useConfirm().confirm({ title: 'Hapus luggage type', description: `Hapus "${row.name}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Luggage Types" subtitle="Master wadah angkut. Berat dalam gram, dimensi dalam mm." icon="i-lucide-briefcase">
      <template #actions>
        <UButton v-if="can('luggage_types.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900 text-left text-gray-500">
          <tr>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Category</th>
            <th class="px-3 py-2 font-medium text-right">Max (g)</th>
            <th class="px-3 py-2 font-medium text-right">Tare (g)</th>
            <th class="px-3 py-2 font-medium">Active</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2">
              <UBadge color="neutral" variant="soft">{{ row.category }}</UBadge>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.max_weight_g }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-gray-500">{{ row.tare_weight_g }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">
                {{ row.is_active ? 'Yes' : 'No' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('luggage_types.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('luggage_types.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-gray-400">Belum ada data.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Luggage Type' : 'Tambah Luggage Type'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Name" required>
              <UInput v-model="form.name" class="w-full" />
            </UFormField>
            <UFormField label="Category" required>
              <USelect v-model="form.category" :items="CATEGORY_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Max weight (g)" required>
              <UInput v-model.number="form.max_weight_g" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Tare weight (g)">
              <UInput v-model.number="form.tare_weight_g" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Max volume (cm³)">
              <UInput v-model.number="form.max_volume_cm3" type="number" class="w-full" />
            </UFormField>
            <div />
            <UFormField label="Inner L (mm)">
              <UInput v-model.number="form.inner_length_mm" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Inner W (mm)">
              <UInput v-model.number="form.inner_width_mm" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Inner H (mm)">
              <UInput v-model.number="form.inner_height_mm" type="number" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Regulation note">
            <UTextarea v-model="form.regulation_note" class="w-full" :rows="2" />
          </UFormField>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.name.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
