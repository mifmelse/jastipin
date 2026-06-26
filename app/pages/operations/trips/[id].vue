<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { trip, status } = useTrip(id)

const tabs = [
  { label: 'Overview', slot: 'overview' as const, icon: 'i-lucide-info' },
  { label: 'Routes/Legs', slot: 'routes' as const, icon: 'i-lucide-route' },
]
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/operations/trips"
      class="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" /> Trips
    </NuxtLink>

    <div v-if="status === 'pending'" class="text-sm text-stone-400">Memuat…</div>
    <div v-else-if="!trip" class="text-sm text-stone-400">Trip tidak ditemukan.</div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-xl font-semibold">{{ trip.name }}</h1>
        <span class="font-mono text-xs text-stone-400">{{ trip.code }}</span>
        <UBadge color="neutral" variant="soft">{{ trip.type }}</UBadge>
        <UBadge :color="tripStatusColor(trip.status)" variant="soft">{{ trip.status }}</UBadge>
      </div>

      <UTabs :items="tabs" class="w-full">
        <template #overview>
          <TripOverview :trip-id="id" />
        </template>
        <template #routes>
          <TripRoutesPanel :trip-id="id" :trip-type="trip.type" />
        </template>
      </UTabs>
    </template>
  </div>
</template>
