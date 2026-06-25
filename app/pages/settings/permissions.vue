<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['permissions']['Row']

const { items, create, update, remove } = usePermissions()
const toast = useToast()

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ key: '', description: '' })

function openCreate() {
  editing.value = null
  Object.assign(form, { key: '', description: '' })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, { key: row.key, description: row.description ?? '' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = { key: form.key.trim(), description: form.description.trim() || null }
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
  if (!(await useConfirm().confirm({ title: 'Hapus permission', description: `Hapus "${row.key}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Permissions</h1>
        <p class="text-sm text-gray-500">Format <code>resource.action</code>. Mengatur visibilitas UI.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900 text-left text-gray-500">
          <tr>
            <th class="px-3 py-2 font-medium">Key</th>
            <th class="px-3 py-2 font-medium">Description</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-mono text-xs">{{ row.key }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.description }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="3" class="px-3 py-6 text-center text-gray-400">Belum ada data.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Permission' : 'Tambah Permission'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Key" required help="contoh: orders.read">
            <UInput v-model="form.key" class="w-full" placeholder="resource.action" />
          </UFormField>
          <UFormField label="Description">
            <UInput v-model="form.description" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.key.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
