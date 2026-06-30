<script setup lang="ts">
const props = defineProps<{ tripId: string }>()
const tripId = toRef(props, 'tripId')

const { can } = useCan()
const { items, add, updateRole, remove } = useTripTravelers(tripId)
const { items: profiles } = useProfiles()
const toast = useToast()

const ROLE_OPTIONS = [
  { label: 'Lead', value: 'lead' },
  { label: 'Assistant', value: 'assistant' },
]

// Only offer users not already assigned to this trip.
const assignedIds = computed(() => new Set((items.value ?? []).map((t) => t.profile_id)))
const profileOptions = computed(() =>
  (profiles.value ?? [])
    .filter((p) => !assignedIds.value.has(p.id))
    .map((p) => ({ label: p.full_name ?? '(tanpa nama)', value: p.id })),
)

const open = ref(false)
const saving = ref(false)
const form = reactive({ profile_id: '', role: 'assistant' })

function openAdd() {
  Object.assign(form, { profile_id: '', role: 'assistant' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    await add(form.profile_id, form.role)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menambah', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onRole(id: string, role: string) {
  try {
    await updateRole(id, role)
  } catch (e) {
    toast.add({ title: 'Gagal mengubah role', description: (e as Error).message, color: 'error' })
  }
}
async function onRemove(id: string, name: string) {
  if (!(await useConfirm().confirm({ title: 'Lepas traveler', description: `Lepas "${name}" dari trip ini?`, confirmLabel: 'Lepas' }))) return
  try {
    await remove(id)
  } catch (e) {
    toast.add({ title: 'Gagal melepas', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-stone-500">Siapa yang ikut membawa barang di trip ini.</p>
    <FabAdd label="Tambah traveler" @click="openAdd" />

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
      <div v-for="t in items ?? []" :key="t.id" class="flex items-center justify-between gap-3 p-3">
        <div class="flex items-center gap-2 min-w-0">
          <MediaThumb :url="null" size="size-8" rounded="rounded-full" icon="i-lucide-user" />
          <span class="font-medium truncate">{{ t.profiles?.full_name ?? '(tanpa nama)' }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <USelect
            :model-value="t.role"
            :items="ROLE_OPTIONS"
            size="xs"
            class="w-28"
            :disabled="!can('trips.write')"
            @update:model-value="(v: string) => onRole(t.id, v)"
          />
          <UButton v-if="can('trips.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-x" aria-label="Lepas traveler" @click="onRemove(t.id, t.profiles?.full_name ?? '')" />
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada traveler.</p>
    </div>

    <UModal v-model:open="open" title="Tambah traveler">
      <template #body>
        <div class="space-y-4">
          <UFormField label="User" required>
            <USelect v-model="form.profile_id" :items="profileOptions" class="w-full" placeholder="Pilih user…" />
          </UFormField>
          <UFormField label="Role">
            <USelect v-model="form.role" :items="ROLE_OPTIONS" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.profile_id" @click="save">Tambah</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
