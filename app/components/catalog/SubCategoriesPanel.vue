<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['sub_categories']['Row']

const { can } = useCan()
const { items, create, update, remove } = useSubCategories()
const { items: categories } = useCategories()
const toast = useToast()

const categoryOptions = computed(() =>
  (categories.value ?? []).map((c) => ({ label: c.name, value: c.id })),
)

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ category_id: '', name: '', is_active: true })

function openCreate() {
  editing.value = null
  Object.assign(form, { category_id: '', name: '', is_active: true })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, { category_id: row.category_id, name: row.name, is_active: row.is_active })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = { category_id: form.category_id, name: form.name.trim(), is_active: form.is_active }
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
  if (!(await useConfirm().confirm({ title: 'Hapus sub-category', description: `Hapus "${row.name}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const valid = computed(() => form.name.trim() && form.category_id)
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UButton v-if="can('categories.write')" icon="i-lucide-plus" :disabled="!(categories?.length)" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Category</th>
            <th class="px-3 py-2 font-medium">Active</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.categories?.name ?? '—' }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">
                {{ row.is_active ? 'Yes' : 'No' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('categories.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('categories.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="4" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Sub-category' : 'Tambah Sub-category'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Category" required>
            <USelect v-model="form.category_id" :items="categoryOptions" class="w-full" placeholder="Pilih…" />
          </UFormField>
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
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
