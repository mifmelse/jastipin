<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { MasterTable, MasterRow } from '~/composables/useSimpleMaster'
import type { ExcelRow } from '~/composables/useExcel'
import type { ImportReport } from '~/components/ExcelToolbar.vue'

// Reusable CRUD for the uniform {name, is_active} A4 masters. One file drives
// all five pages; each page is just a thin wrapper passing table + labels.
const props = defineProps<{
  table: MasterTable
  title: string
  subtitle: string
  icon: string
  permission: string
}>()

const { can } = useCan()
const supabase = useSupabaseClient<Database>()
const { items, create, update, remove, refresh } = useSimpleMaster(props.table)
const toast = useToast()

// Excel export = current rows; import = upsert by name (idempotent re-seed).
function exportRows(): ExcelRow[] {
  return (items.value ?? []).map((r) => ({ name: r.name, is_active: r.is_active }))
}
async function importRows(rows: ExcelRow[]): Promise<ImportReport> {
  const report: ImportReport = { inserted: 0, updated: 0, errors: [] }
  const existing = new Set((items.value ?? []).map((r) => r.name))
  for (let i = 0; i < rows.length; i++) {
    const rowNo = i + 2 // +1 header, +1 to 1-index
    const name = String(rows[i]!.name ?? '').trim()
    if (!name) {
      report.errors.push({ row: rowNo, message: 'Kolom name kosong' })
      continue
    }
    const raw = rows[i]!.is_active
    const is_active = !(raw === false || String(raw).toLowerCase() === 'false' || String(raw) === '0')
    const { error } = await supabase.from(props.table).upsert({ name, is_active }, { onConflict: 'name' })
    if (error) {
      report.errors.push({ row: rowNo, message: error.message })
      continue
    }
    if (existing.has(name)) report.updated++
    else report.inserted++
  }
  await refresh()
  return report
}

const open = ref(false)
const saving = ref(false)
const editing = ref<MasterRow | null>(null)
const form = reactive({ name: '', is_active: true })

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', is_active: true })
  open.value = true
}
function openEdit(row: MasterRow) {
  editing.value = row
  Object.assign(form, { name: row.name, is_active: row.is_active })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = { name: form.name.trim(), is_active: form.is_active }
    if (editing.value) await update(editing.value.id, payload)
    else await create(payload)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: MasterRow) {
  if (!(await useConfirm().confirm({ title: `Hapus ${props.title}`, description: `Hapus "${row.name}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader :title="title" :subtitle="subtitle" :icon="icon">
      <template #actions>
        <ExcelToolbar
          :filename="table"
          :export-rows="exportRows"
          :import-rows="importRows"
          :columns="['name', 'is_active']"
          :can-export="can(`${permission}.read`)"
          :can-import="can(`${permission}.write`)"
        />
        <UButton v-if="can(`${permission}.write`)" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">{{ row.is_active ? 'Yes' : 'No' }}</UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can(`${permission}.write`)" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can(`${permission}.delete`)" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
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
        class="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 flex items-center justify-between gap-2"
      >
        <span class="font-medium truncate">{{ row.name }}</span>
        <div class="flex items-center gap-2 shrink-0">
          <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">{{ row.is_active ? 'Yes' : 'No' }}</UBadge>
          <UButton v-if="can(`${permission}.write`)" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
          <UButton v-if="can(`${permission}.delete`)" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
    </div>

    <UModal v-model:open="open" :title="editing ? `Edit ${title}` : `Tambah ${title}`">
      <template #body>
        <div class="space-y-4">
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
          <UButton :loading="saving" :disabled="!form.name.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
