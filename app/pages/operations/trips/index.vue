<script setup lang="ts">
import type { Database } from '~/types/database.types'

type TripRow = Database['public']['Tables']['trips']['Row']

const { can } = useCan()
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
// command-palette quick action: /operations/trips?new=1
useAutoOpen('new', openCreate)
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
    <PageHeader title="Trips" subtitle="Perjalanan jastip — container semua aktivitas." icon="i-lucide-plane">
      <template #actions>
        <UButton v-if="can('trips.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Code</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Type</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Legs</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Traveler</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-16"></th>
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
                <UButton v-if="can('trips.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada trip.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mobile: cards instead of a cramped table -->
    <div class="md:hidden space-y-2">
      <button
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
        @click="router.push(`/operations/trips/${row.id}`)"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.name }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ row.code }}</span>
          </div>
          <UBadge :color="tripStatusColor(row.status)" variant="soft" class="shrink-0">{{ row.status }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.type }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ legCount(row) }} legs</span>
        </div>
      </button>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada trip.</p>
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
