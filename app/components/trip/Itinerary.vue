<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['trip_itineraries']['Row']

const props = defineProps<{ tripId: string }>()
const { items, create, update, remove } = useTripItineraries(props.tripId)
const toast = useToast()

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ date: '', title: '', description: '' })

function openCreate() {
  editing.value = null
  Object.assign(form, { date: '', title: '', description: '' })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, { date: row.date ?? '', title: row.title, description: row.description ?? '' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      trip_id: props.tripId,
      date: form.date || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
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
  if (!(await useConfirm().confirm({ title: 'Hapus itinerary', description: `Hapus "${row.title}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-3 pb-20">
    <div v-if="items?.length" class="space-y-2">
      <div
        v-for="row in items"
        :key="row.id"
        class="rounded-lg border border-stone-200 dark:border-stone-800 p-3 flex items-start justify-between gap-3"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge v-if="row.date" color="primary" variant="soft">{{ row.date }}</UBadge>
            <span class="font-medium">{{ row.title }}</span>
          </div>
          <p v-if="row.description" class="text-sm text-stone-500 mt-1 whitespace-pre-line">
            {{ row.description }}
          </p>
        </div>
        <div class="flex gap-1 shrink-0">
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
          <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-stone-400 text-center py-10">Belum ada itinerary.</p>

    <FabAdd label="Tambah" @click="openCreate" />

    <UModal v-model:open="open" :title="editing ? 'Edit Itinerary' : 'Tambah Itinerary'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tanggal">
            <UInput v-model="form.date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Judul" required>
            <UInput v-model="form.title" class="w-full" placeholder="mis. Tiba di Tokyo" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" :rows="3" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.title.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
