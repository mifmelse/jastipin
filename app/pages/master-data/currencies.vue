<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { ExcelRow } from '~/composables/useExcel'
import type { ImportReport } from '~/components/ExcelToolbar.vue'

type Row = Database['public']['Tables']['currencies']['Row']

const { can } = useCan()
const supabase = useSupabaseClient<Database>()
const { items, create, update, remove, refresh } = useCurrencies()
const toast = useToast()

function exportRows(): ExcelRow[] {
  return (items.value ?? []).map((c) => ({ code: c.code, name: c.name, symbol: c.symbol ?? '', is_active: c.is_active }))
}
async function importRows(rows: ExcelRow[]): Promise<ImportReport> {
  const report: ImportReport = { inserted: 0, updated: 0, errors: [] }
  const existing = new Set((items.value ?? []).map((c) => c.code))
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const rowNo = i + 2
    const code = String(r.code ?? '').trim().toUpperCase()
    const name = String(r.name ?? '').trim()
    if (!code || !name) { report.errors.push({ row: rowNo, message: 'code & name wajib' }); continue }
    const { error } = await supabase.from('currencies').upsert(
      { code, name, symbol: String(r.symbol ?? '').trim() || null, is_active: activeCell(r.is_active) },
      { onConflict: 'code' },
    )
    if (error) { report.errors.push({ row: rowNo, message: error.message }); continue }
    if (existing.has(code)) report.updated++
    else report.inserted++
  }
  await refresh()
  return report
}

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ code: '', name: '', symbol: '', is_active: true })

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', symbol: '', is_active: true })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, { code: row.code, name: row.name, symbol: row.symbol ?? '', is_active: row.is_active })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim() || null,
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
  if (!(await useConfirm().confirm({ title: 'Hapus currency', description: `Hapus "${row.code}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Currencies" subtitle="Mata uang. Base pelaporan = IDR." icon="i-lucide-coins">
      <template #actions>
        <ExcelToolbar filename="currencies" :export-rows="exportRows" :import-rows="importRows" :columns="['code', 'name', 'symbol', 'is_active']" :can-export="can('currencies.read')" :can-import="can('currencies.write')" />
        <UButton v-if="can('currencies.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Code</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Symbol</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-mono">{{ row.code }}</td>
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.symbol ?? '—' }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">
                {{ row.is_active ? 'Yes' : 'No' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('currencies.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('currencies.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="5" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
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
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ row.code }}</span>
          </div>
          <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft" class="shrink-0">
            {{ row.is_active ? 'Yes' : 'No' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">Symbol</span>
          <span class="font-medium tabular-nums shrink-0">{{ row.symbol ?? '—' }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Currency' : 'Tambah Currency'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Code" required help="ISO 4217, mis. IDR">
              <UInput v-model="form.code" maxlength="3" class="w-full" />
            </UFormField>
            <UFormField label="Symbol">
              <UInput v-model="form.symbol" class="w-full" />
            </UFormField>
          </div>
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
          <UButton :loading="saving" :disabled="!form.code.trim() || !form.name.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
