<script setup lang="ts">
const { items: trips } = useTrips()
const { items: allLegs } = useAllLegs()

const selected = ref(NONE)
const selectedRoute = ref(NONE)
const tripId = computed(() => toNullable(selected.value))
const routeId = computed(() => toNullable(selectedRoute.value))

const tripOptions = computed(() => [
  { label: 'Pilih trip…', value: NONE },
  ...(trips.value ?? []).map((t) => ({ label: t.code ? `${t.code} · ${t.name}` : t.name, value: t.id })),
])
const routeOptions = computed(() => [
  { label: 'Pilih route…', value: NONE },
  ...(allLegs.value ?? [])
    .filter((l) => l.trip_id === tripId.value)
    .map((l) => ({ label: legLabel(l as LegEmbed), value: l.id })),
])

// Switching trip clears the route selection.
watch(tripId, () => {
  selectedRoute.value = NONE
})

const tabs = [
  { label: 'Packing Board', slot: 'board' as const, icon: 'i-lucide-layout-grid' },
  { label: 'Luggage', slot: 'luggage' as const, icon: 'i-lucide-luggage' },
  { label: 'Simulation', slot: 'simulation' as const, icon: 'i-lucide-scale' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Load Planning" subtitle="Muat barang ke luggage dengan simulasi berat & volume per route." icon="i-lucide-luggage">
      <template #actions>
        <div class="flex items-center gap-2">
          <USelect v-model="selected" :items="tripOptions" class="w-56" />
          <USelect v-model="selectedRoute" :items="routeOptions" :disabled="!tripId" class="w-56" />
        </div>
      </template>
    </PageHeader>

    <p v-if="!tripId" class="text-sm text-stone-400 text-center py-16 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
      Pilih trip dulu untuk mulai packing.
    </p>

    <UTabs v-else :items="tabs" class="w-full">
      <template #board><LoadplanningPackingBoard :trip-id="tripId" :route-id="routeId" /></template>
      <template #luggage><LoadplanningLuggagePanel :trip-id="tripId" /></template>
      <template #simulation><LoadplanningSimulationPanel :trip-id="tripId" /></template>
    </UTabs>
  </div>
</template>
