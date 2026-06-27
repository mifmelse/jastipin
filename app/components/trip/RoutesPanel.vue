<script setup lang="ts">
const { can } = useCan()
const props = defineProps<{ tripId: string; tripType: string }>()
const { items, create, createMany, remove, refresh } = useTripRoutes(props.tripId)
const { items: countries } = useCountries()
const toast = useToast()

const countryOptions = computed(() => (countries.value ?? []).map((c) => ({ label: c.name, value: c.id })))

// single/round allow a single "add" action; multi is unbounded. (Round's add
// produces 2 legs at once, so it's also gated on having no legs yet.)
const canAdd = computed(() => props.tripType === 'multi' || (items.value?.length ?? 0) === 0)
const isRound = computed(() => props.tripType === 'round')

const hint = computed(
  () =>
    ({
      single: 'Single: tepat 1 leg (A → B).',
      round: 'Round: isi leg pergi (A → B); leg balik (B → A) dibuat otomatis.',
      multi: 'Multi: tambah leg sepuasnya; origin tiap leg otomatis = destinasi leg sebelumnya.',
    })[props.tripType] ?? '',
)

// If the trip type changes elsewhere, the DB resets the legs — re-fetch.
watch(() => props.tripType, () => refresh())

const open = ref(false)
const saving = ref(false)
const form = reactive({ from_country_id: '', to_country_id: '', departure_date: '', return_date: '' })

function openAdd() {
  const last = items.value?.[items.value.length - 1]
  // Multi auto-chains: a new leg departs from where the previous leg arrived.
  const from = props.tripType === 'multi' ? (last?.to_country_id ?? '') : ''
  Object.assign(form, { from_country_id: from, to_country_id: '', departure_date: '', return_date: '' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    if (isRound.value) {
      await createMany([
        {
          trip_id: props.tripId,
          from_country_id: form.from_country_id,
          to_country_id: form.to_country_id,
          departure_date: form.departure_date || null,
          sequence: 1,
        },
        {
          trip_id: props.tripId,
          from_country_id: form.to_country_id,
          to_country_id: form.from_country_id,
          departure_date: form.return_date || null,
          sequence: 2,
        },
      ])
    } else {
      await create({
        trip_id: props.tripId,
        from_country_id: form.from_country_id,
        to_country_id: form.to_country_id,
        departure_date: form.departure_date || null,
        sequence: (items.value?.length ?? 0) + 1,
      })
    }
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: { id: string; sequence: number }) {
  if (!(await useConfirm().confirm({ title: 'Hapus leg', description: `Hapus leg #${row.sequence}?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const valid = computed(
  () => form.from_country_id && form.to_country_id && form.from_country_id !== form.to_country_id,
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-stone-500">{{ hint }}</p>
      <UButton v-if="can('trips.write')" icon="i-lucide-plus" :disabled="!canAdd" @click="openAdd">
        {{ isRound ? 'Tambah rute' : 'Tambah leg' }}
      </UButton>
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide w-12">#</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Route</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Departure</th>
            <th class="px-3 py-2.5 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 tabular-nums text-stone-500">{{ row.sequence }}</td>
            <td class="px-3 py-2 font-medium">
              {{ row.from_country?.name }} <span class="text-stone-400">→</span> {{ row.to_country?.name }}
            </td>
            <td class="px-3 py-2 text-stone-500">{{ row.departure_date ?? '—' }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end">
                <UButton v-if="can('trips.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="4" class="px-3 py-6 text-center text-stone-400">Belum ada leg.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.from_country?.name }} <span class="text-stone-400">→</span> {{ row.to_country?.name }}</span>
          </div>
          <span class="font-mono text-xs text-stone-400 shrink-0">#{{ row.sequence }}</span>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">Departure</span>
          <span class="font-medium tabular-nums shrink-0">{{ row.departure_date ?? '—' }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada leg.</p>
    </div>

    <UModal v-model:open="open" :title="isRound ? 'Tambah Rute (pergi–balik)' : 'Tambah Leg'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="From" required>
              <USelect v-model="form.from_country_id" :items="countryOptions" class="w-full" placeholder="Pilih…" />
            </UFormField>
            <UFormField label="To" required>
              <USelect v-model="form.to_country_id" :items="countryOptions" class="w-full" placeholder="Pilih…" />
            </UFormField>
            <UFormField :label="isRound ? 'Departure (pergi)' : 'Departure date'">
              <UInput v-model="form.departure_date" type="date" class="w-full" />
            </UFormField>
            <UFormField v-if="isRound" label="Return (balik)">
              <UInput v-model="form.return_date" type="date" class="w-full" />
            </UFormField>
          </div>
          <p v-if="isRound" class="text-xs text-stone-500">
            Leg balik (To → From) dibuat otomatis.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!valid" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
