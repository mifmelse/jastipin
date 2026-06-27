<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { ExcelRow } from '~/composables/useExcel'
import type { ImportReport } from '~/components/ExcelToolbar.vue'

type Row = Database['public']['Tables']['luggage_types']['Row']

const { can } = useCan()
const supabase = useSupabaseClient<Database>()
const { items, create, update, remove, refresh } = useLuggageTypes()
const toast = useToast()

function exportRows(): ExcelRow[] {
  return (items.value ?? []).map((l) => ({
    name: l.name,
    category: l.category,
    max_weight_g: l.max_weight_g,
    tare_weight_g: l.tare_weight_g,
    max_volume_cm3: l.max_volume_cm3,
    inner_length_mm: l.inner_length_mm,
    inner_width_mm: l.inner_width_mm,
    inner_height_mm: l.inner_height_mm,
    regulation_note: l.regulation_note ?? '',
    is_active: l.is_active,
  }))
}
async function importRows(rows: ExcelRow[]): Promise<ImportReport> {
  const report: ImportReport = { inserted: 0, updated: 0, errors: [] }
  const existing = new Set((items.value ?? []).map((l) => l.name))
  const CATS = ['checked', 'cabin', 'personal']
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const rowNo = i + 2
    const name = String(r.name ?? '').trim()
    if (!name) { report.errors.push({ row: rowNo, message: 'name kosong' }); continue }
    const category = String(r.category ?? '').trim().toLowerCase()
    if (!CATS.includes(category)) { report.errors.push({ row: rowNo, message: `category harus salah satu dari ${CATS.join('/')}` }); continue }
    const maxW = Number(r.max_weight_g)
    if (!maxW || maxW <= 0) { report.errors.push({ row: rowNo, message: 'max_weight_g harus > 0' }); continue }
    const { error } = await supabase.from('luggage_types').upsert({
      name,
      category,
      max_weight_g: maxW,
      tare_weight_g: Number(r.tare_weight_g) || 0,
      max_volume_cm3: numCell(r.max_volume_cm3) === '' ? null : Number(r.max_volume_cm3),
      inner_length_mm: numCell(r.inner_length_mm) === '' ? null : Number(r.inner_length_mm),
      inner_width_mm: numCell(r.inner_width_mm) === '' ? null : Number(r.inner_width_mm),
      inner_height_mm: numCell(r.inner_height_mm) === '' ? null : Number(r.inner_height_mm),
      regulation_note: String(r.regulation_note ?? '').trim() || null,
      is_active: activeCell(r.is_active),
    }, { onConflict: 'name' })
    if (error) { report.errors.push({ row: rowNo, message: error.message }); continue }
    if (existing.has(name)) report.updated++
    else report.inserted++
  }
  await refresh()
  return report
}

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
        <ExcelToolbar filename="luggage-types" :export-rows="exportRows" :import-rows="importRows" :can-export="can('luggage_types.read')" :can-import="can('luggage_types.write')" />
        <UButton v-if="can('luggage_types.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Category</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Max (g)</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Tare (g)</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2">
              <UBadge color="neutral" variant="soft">{{ row.category }}</UBadge>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.max_weight_g }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ row.tare_weight_g }}</td>
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
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada data.</td>
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
          <span class="text-xs text-stone-500 truncate">{{ row.category }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ row.max_weight_g }} g</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada data.</p>
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
