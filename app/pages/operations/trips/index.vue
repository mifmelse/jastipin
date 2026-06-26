<script setup lang="ts">
import type { Database } from '~/types/database.types'

type TripRow = Database['public']['Tables']['trips']['Row']

const { items, create, remove } = useTrips()
const toast = useToast()
const router = useRouter()

const open = ref(false)
const saving = ref(false)
const form = reactive({
  name: '',
  type: 'single',
  traveler_count: 1,
  total_capacity_kg: '' as number | '',
  status: 'draft',
})

function openCreate() {
  Object.assign(form, { name: '', type: 'single', traveler_count: 1, total_capacity_kg: '', status: 'draft' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const created = await create({
      name: form.name.trim(),
      type: form.type,
      traveler_count: Number(form.traveler_count) || 1,
      total_capacity_kg: form.total_capacity_kg === '' ? null : Number(form.total_capacity_kg),
      status: form.status,
    })
    open.value = false
    if (created?.id) router.push(`/operations/trips/${created.id}`)
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: TripRow) {
  if (!(await useConfirm().confirm({ title: 'Hapus trip', description: `Hapus "${row.name}"? Semua leg/booking/expense-nya ikut terhapus.` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
const legCount = (row: { trip_routes?: { count: number }[] }) => row.trip_routes?.[0]?.count ?? 0
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Trips</h1>
        <p class="text-sm text-stone-500">Perjalanan jastip — container semua aktivitas.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Code</th>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Type</th>
            <th class="px-3 py-2 font-medium text-right">Legs</th>
            <th class="px-3 py-2 font-medium text-right">Traveler</th>
            <th class="px-3 py-2 font-medium">Status</th>
            <th class="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr
            v-for="row in items ?? []"
            :key="row.id"
            class="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
            @click="router.push(`/operations/trips/${row.id}`)"
          >
            <td class="px-3 py-2 font-mono text-xs">{{ row.code }}</td>
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2"><UBadge color="neutral" variant="soft">{{ row.type }}</UBadge></td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ legCount(row) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ row.traveler_count }}</td>
            <td class="px-3 py-2">
              <UBadge :color="tripStatusColor(row.status)" variant="soft">{{ row.status }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada trip.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" title="Tambah Trip">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Type" required>
              <USelect v-model="form.type" :items="TRIP_TYPE_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="form.status" :items="TRIP_STATUS_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Traveler count">
              <UInput v-model.number="form.traveler_count" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Total capacity (kg)">
              <UInput v-model.number="form.total_capacity_kg" type="number" class="w-full" />
            </UFormField>
          </div>
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
