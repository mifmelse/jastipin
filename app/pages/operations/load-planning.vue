<script setup lang="ts">
const { items: trips } = useTrips()

const selected = ref(NONE)
const tripId = computed(() => toNullable(selected.value))
const tripOptions = computed(() => [
  { label: 'Pilih trip…', value: NONE },
  ...(trips.value ?? []).map((t) => ({ label: t.code ? `${t.code} · ${t.name}` : t.name, value: t.id })),
])

const tabs = [
  { label: 'Packing Board', slot: 'board' as const, icon: 'i-lucide-layout-grid' },
  { label: 'Luggage', slot: 'luggage' as const, icon: 'i-lucide-luggage' },
  { label: 'Simulation', slot: 'simulation' as const, icon: 'i-lucide-scale' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Load Planning" subtitle="Muat barang ke koper dengan simulasi berat & volume per route." icon="i-lucide-luggage">
      <template #actions>
        <div class="flex items-center gap-2">
          <span class="text-sm text-stone-500">Trip</span>
          <USelect v-model="selected" :items="tripOptions" class="w-64" />
        </div>
      </template>
    </PageHeader>

    <p v-if="!tripId" class="text-sm text-stone-400 text-center py-16 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
      Pilih trip dulu untuk mulai packing.
    </p>

    <UTabs v-else :items="tabs" class="w-full">
      <template #board><LoadplanningPackingBoard :trip-id="tripId" /></template>
      <template #luggage><LoadplanningLuggagePanel :trip-id="tripId" /></template>
      <template #simulation><LoadplanningSimulationPanel :trip-id="tripId" /></template>
    </UTabs>
  </div>
</template>
