<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ tripId: string }>()
const tripId = toRef(props, 'tripId')

type Sim = {
  luggage_id: string
  label: string
  type_name: string
  max_weight_g: number | null
  tare_weight_g: number | null
  max_volume_cm3: number | null
  regulation_note: string | null
  loaded_weight_g: number
  loaded_volume_cm3: number
  item_count: number
}
type Luggage = Database['public']['Tables']['luggages']['Row'] & { assigned?: { full_name: string | null } | null }

const { items } = useLuggageSimulation(tripId)
const { items: luggages } = useLuggages(tripId)
const { items: travelers } = useTripTravelers(tripId)
const rows = computed(() => (items.value as Sim[] ?? []))

// luggage → assigned traveler (B4)
const luggageMap = computed(() => {
  const m = new Map<string, Luggage>()
  for (const l of (luggages.value as Luggage[]) ?? []) m.set(l.id, l)
  return m
})
const assignedId = (luggageId: string) => luggageMap.value.get(luggageId)?.assigned_traveler ?? null
const travelerName = (luggageId: string) => luggageMap.value.get(luggageId)?.assigned?.full_name ?? '—'

const total = (s: Sim) => s.loaded_weight_g + Number(s.tare_weight_g ?? 0)
const over = (s: Sim) => !!s.max_weight_g && total(s) > s.max_weight_g
const remaining = (s: Sim) => Number(s.max_weight_g ?? 0) - total(s)
const volOver = (s: Sim) => !!s.max_volume_cm3 && s.loaded_volume_cm3 > s.max_volume_cm3

// --- filter & sort (B4) ---
const filterTraveler = ref(NONE)
const sortBy = ref<'label' | 'weight' | 'remaining'>('label')
const travelerFilterOptions = computed(() => [
  { label: 'Semua traveler', value: NONE },
  { label: '— belum di-assign —', value: 'unassigned' },
  ...(travelers.value ?? []).map((t) => ({ label: t.profiles?.full_name ?? '(tanpa nama)', value: t.profile_id })),
])
const SORT_OPTIONS = [
  { label: 'Nama wadah', value: 'label' },
  { label: 'Terberat dulu', value: 'weight' },
  { label: 'Paling penuh (sisa sedikit)', value: 'remaining' },
]

const displayRows = computed(() => {
  let r = rows.value
  if (filterTraveler.value === 'unassigned') r = r.filter((s) => !assignedId(s.luggage_id))
  else if (filterTraveler.value !== NONE) r = r.filter((s) => assignedId(s.luggage_id) === filterTraveler.value)
  const sorted = [...r]
  if (sortBy.value === 'weight') sorted.sort((a, b) => total(b) - total(a))
  else if (sortBy.value === 'remaining') sorted.sort((a, b) => remaining(a) - remaining(b))
  else sorted.sort((a, b) => a.label.localeCompare(b.label))
  return sorted
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <USelect v-model="filterTraveler" :items="travelerFilterOptions" class="w-56" icon="i-lucide-user" />
      <USelect v-model="sortBy" :items="SORT_OPTIONS" class="w-56" icon="i-lucide-arrow-down-up" />
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Luggage</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Traveler</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Isi</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Berat (isi + tare)</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Batas</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Sisa</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Volume</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Catatan regulasi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="s in displayRows" :key="s.luggage_id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2">
              <div class="font-medium">{{ s.label }}</div>
              <div class="text-xs text-stone-400">{{ s.type_name }}</div>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ travelerName(s.luggage_id) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ s.item_count }}</td>
            <td class="px-3 py-2 text-right tabular-nums" :class="over(s) ? 'text-error font-semibold' : ''">{{ formatKg(total(s)) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ formatKg(s.max_weight_g) }}</td>
            <td class="px-3 py-2 text-right tabular-nums" :class="over(s) ? 'text-error font-semibold' : 'text-success'">
              {{ over(s) ? `over ${formatKg(-remaining(s))}` : formatKg(remaining(s)) }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums" :class="volOver(s) ? 'text-error' : 'text-stone-500'">
              {{ s.loaded_volume_cm3 ? `${Math.round(s.loaded_volume_cm3).toLocaleString('id-ID')} cm³` : '—' }}
              <span v-if="s.max_volume_cm3" class="text-stone-400">/ {{ Math.round(s.max_volume_cm3).toLocaleString('id-ID') }}</span>
            </td>
            <td class="px-3 py-2 text-xs text-stone-500">{{ s.regulation_note ?? '—' }}</td>
          </tr>
          <tr v-if="!displayRows.length">
            <td colspan="8" class="px-3 py-6 text-center text-stone-400">Belum ada luggage untuk disimulasikan.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="s in displayRows"
        :key="s.luggage_id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ s.label }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ s.type_name }}</span>
          </div>
          <span class="font-medium tabular-nums shrink-0" :class="over(s) ? 'text-error' : ''">{{ formatKg(total(s)) }}</span>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ travelerName(s.luggage_id) }} · {{ s.item_count }} isi</span>
          <span class="font-medium tabular-nums shrink-0" :class="over(s) ? 'text-error' : 'text-success'">
            {{ over(s) ? `over ${formatKg(-remaining(s))}` : formatKg(remaining(s)) }}
          </span>
        </div>
      </div>
      <p v-if="!displayRows.length" class="text-center text-stone-400 text-sm py-6">Belum ada luggage untuk disimulasikan.</p>
    </div>
  </div>
</template>
