<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['permissions']['Row']

const { can } = useCan()
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
    <PageHeader title="Permissions" subtitle="Format resource.action. Mengatur visibilitas UI." icon="i-lucide-key">
      <template #actions>
        <UButton v-if="can('permissions.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Key</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Description</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-mono text-xs">{{ row.key }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.description }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('permissions.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('permissions.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="3" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
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
            <span class="font-medium font-mono text-xs truncate">{{ row.key }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.description }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
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
