<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { ExcelRow } from '~/composables/useExcel'
import type { ImportReport } from '~/components/ExcelToolbar.vue'

type Row = Database['public']['Tables']['categories']['Row']

const { can } = useCan()
const supabase = useSupabaseClient<Database>()
const { items, create, update, remove, refresh } = useCategories()
const toast = useToast()

function exportRows(): ExcelRow[] {
  return (items.value ?? []).map((c) => ({ name: c.name, description: c.description ?? '', is_active: c.is_active }))
}
async function importRows(rows: ExcelRow[]): Promise<ImportReport> {
  const report: ImportReport = { inserted: 0, updated: 0, errors: [] }
  const existing = new Set((items.value ?? []).map((c) => c.name))
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const rowNo = i + 2
    const name = String(r.name ?? '').trim()
    if (!name) { report.errors.push({ row: rowNo, message: 'name kosong' }); continue }
    const description = String(r.description ?? '').trim() || null
    const { error } = await supabase.from('categories').upsert({ name, description, is_active: activeCell(r.is_active) }, { onConflict: 'name' })
    if (error) { report.errors.push({ row: rowNo, message: error.message }); continue }
    if (existing.has(name)) report.updated++
    else report.inserted++
  }
  await refresh()
  return report
}

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ name: '', description: '', is_active: true })

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', description: '', is_active: true })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, { name: row.name, description: row.description ?? '', is_active: row.is_active })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = { name: form.name.trim(), description: form.description.trim() || null, is_active: form.is_active }
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
  if (!(await useConfirm().confirm({ title: 'Hapus category', description: `Hapus "${row.name}"? Sub-category-nya ikut terhapus.` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end gap-2">
      <ExcelToolbar
        filename="categories"
        :export-rows="exportRows"
        :import-rows="importRows"
        :columns="['name', 'description', 'is_active']"
        :can-export="can('categories.read')"
        :can-import="can('categories.write')"
      />
      <UButton v-if="can('categories.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Description</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.description ?? '—' }}</td>
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

    <!-- mobile: cards instead of a cramped table -->
    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.name }}</span>
          </div>
          <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft" class="shrink-0">
            {{ row.is_active ? 'Yes' : 'No' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.description ?? '—' }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Category' : 'Tambah Category'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="2" />
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
