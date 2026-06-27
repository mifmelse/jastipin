<script setup lang="ts">
import type { ExcelRow } from '~/composables/useExcel'

export interface ImportReport {
  inserted: number
  updated: number
  errors: { row: number; message: string }[]
}

// Reusable export/import toolbar. The resource supplies exportRows() (flat
// objects, FKs as names) and optionally importRows() (validate + upsert/insert
// + per-row error report). File I/O + the report UI live here.
const props = defineProps<{
  filename: string
  exportRows: () => ExcelRow[]
  importRows?: (rows: ExcelRow[]) => Promise<ImportReport>
  canExport?: boolean
  canImport?: boolean
}>()

const { exportToXlsx, importFromXlsx } = useExcel()
const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const importing = ref(false)
const report = ref<ImportReport | null>(null)
const reportOpen = ref(false)

async function doExport() {
  const rows = props.exportRows()
  if (!rows.length) {
    toast.add({ title: 'Tidak ada data untuk diekspor', color: 'warning' })
    return
  }
  await exportToXlsx(props.filename, rows)
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !props.importRows) return
  importing.value = true
  try {
    const rows = await importFromXlsx(file)
    const r = await props.importRows(rows)
    report.value = r
    reportOpen.value = true
    toast.add({
      title: `Import: ${r.inserted} baru · ${r.updated} update · ${r.errors.length} error`,
      color: r.errors.length ? 'warning' : 'success',
    })
  } catch (err) {
    toast.add({ title: 'Gagal import', description: (err as Error).message, color: 'error' })
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton v-if="canExport !== false" size="sm" color="neutral" variant="soft" icon="i-lucide-download" @click="doExport">
      Export
    </UButton>
    <template v-if="importRows && canImport">
      <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-upload" :loading="importing" @click="fileInput?.click()">
        Import
      </UButton>
      <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFile" />
    </template>

    <UModal v-model:open="reportOpen" title="Hasil import">
      <template #body>
        <div v-if="report" class="space-y-2 text-sm">
          <p>
            <span class="font-semibold text-success">{{ report.inserted }}</span> ditambah ·
            <span class="font-semibold text-primary">{{ report.updated }}</span> diupdate ·
            <span class="font-semibold" :class="report.errors.length ? 'text-warning' : 'text-stone-500'">{{ report.errors.length }}</span> error
          </p>
          <div v-if="report.errors.length" class="max-h-64 overflow-y-auto space-y-1 border-t border-stone-100 dark:border-stone-800 pt-2">
            <div v-for="(e, i) in report.errors" :key="i" class="text-xs text-red-500">Baris {{ e.row }}: {{ e.message }}</div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" @click="reportOpen = false">Tutup</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
