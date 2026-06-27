<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ tripId: string }>()
const tripId = toRef(props, 'tripId')

type Luggage = Database['public']['Tables']['luggages']['Row'] & {
  luggage_types?: { name: string; category: string } | null
  assigned?: { full_name: string | null } | null
  load_items?: { id: string }[]
}

const { can } = useCan()
const { items, create, update, remove } = useLuggages(tripId)
const { items: types } = useLuggageTypes()
const { items: travelers } = useTripTravelers(tripId)
const toast = useToast()

const typeOptions = computed(() => (types.value ?? []).map((t) => ({ label: t.name, value: t.id })))
// Scoped to this trip's travelers (B2) — not every user in the system.
const travelerOptions = computed(() => [
  { label: '— belum di-assign —', value: NONE },
  ...(travelers.value ?? []).map((t) => ({ label: t.profiles?.full_name ?? '(tanpa nama)', value: t.profile_id })),
])

const open = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ label: '', luggage_type_id: '', assigned_traveler: NONE, status: 'planned' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { label: '', luggage_type_id: typeOptions.value[0]?.value ?? '', assigned_traveler: NONE, status: 'planned' })
  open.value = true
}
function openEdit(l: Luggage) {
  editingId.value = l.id
  Object.assign(form, {
    label: l.label,
    luggage_type_id: l.luggage_type_id,
    assigned_traveler: fromNullable(l.assigned_traveler),
    status: l.status,
  })
  open.value = true
}
const canSave = computed(() => !!form.label.trim() && !!form.luggage_type_id)

async function save() {
  saving.value = true
  try {
    const payload = {
      trip_id: props.tripId,
      label: form.label.trim(),
      luggage_type_id: form.luggage_type_id,
      assigned_traveler: toNullable(form.assigned_traveler),
      status: form.status,
    }
    if (editingId.value) await update(editingId.value, payload)
    else await create(payload)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(l: Luggage) {
  if (!(await useConfirm().confirm({ title: 'Hapus luggage', description: `Hapus "${l.label}"? Barang di dalamnya akan dikeluarkan (balik ke stok).` }))) return
  try {
    await remove(l.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
const itemCount = (l: Luggage) => l.load_items?.length ?? 0
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UButton v-if="can('load_planning.write')" icon="i-lucide-plus" @click="openCreate">Tambah luggage</UButton>
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Label</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Tipe</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Traveler</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Isi</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="l in (items as Luggage[]) ?? []" :key="l.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-medium">{{ l.label }}</td>
            <td class="px-3 py-2 text-stone-500">{{ l.luggage_types?.name }}</td>
            <td class="px-3 py-2 text-stone-500">{{ l.assigned?.full_name ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ itemCount(l) }}</td>
            <td class="px-3 py-2">
              <UBadge :color="luggageStatusColor(l.status)" variant="soft" class="capitalize">{{ l.status }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end gap-1">
                <UButton v-if="can('load_planning.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit luggage" @click="openEdit(l)" />
                <UButton v-if="can('load_planning.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus luggage" @click="onDelete(l)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada luggage untuk trip ini.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="l in (items as Luggage[]) ?? []"
        :key="l.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ l.label }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ l.luggage_types?.name }}</span>
          </div>
          <UBadge :color="luggageStatusColor(l.status)" variant="soft" class="capitalize shrink-0">{{ l.status }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ l.assigned?.full_name ?? '—' }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ itemCount(l) }} isi</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada luggage untuk trip ini.</p>
    </div>

    <UModal v-model:open="open" :title="editingId ? 'Edit Luggage' : 'Tambah Luggage'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Label" required>
            <UInput v-model="form.label" class="w-full" placeholder="mis. Koper A" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Tipe" required>
              <USelect v-model="form.luggage_type_id" :items="typeOptions" class="w-full" />
            </UFormField>
            <UFormField label="Traveler">
              <USelect v-model="form.assigned_traveler" :items="travelerOptions" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="form.status" :items="LUGGAGE_STATUS_OPTIONS" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canSave" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
