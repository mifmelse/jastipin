<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { trip, status } = useTrip(id)

const tabs = [
  { label: 'Overview', slot: 'overview' as const, icon: 'i-lucide-info' },
  { label: 'Routes', slot: 'routes' as const, icon: 'i-lucide-route' },
  { label: 'Travelers', slot: 'travelers' as const, icon: 'i-lucide-users' },
  { label: 'Itinerary', slot: 'itinerary' as const, icon: 'i-lucide-calendar-days' },
  { label: 'Bookings', slot: 'bookings' as const, icon: 'i-lucide-ticket' },
  { label: 'Expenses', slot: 'expenses' as const, icon: 'i-lucide-receipt' },
  { label: 'Moments', slot: 'moments' as const, icon: 'i-lucide-camera' },
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
      <PageHeader :title="trip.name" icon="i-lucide-plane">
        <template #actions>
          <span class="font-mono text-xs text-stone-400">{{ trip.code }}</span>
          <UBadge color="neutral" variant="soft">{{ trip.type }}</UBadge>
          <UBadge :color="tripStatusColor(trip.status)" variant="soft">{{ trip.status }}</UBadge>
        </template>
      </PageHeader>

      <UTabs :items="tabs" class="w-full">
        <template #overview>
          <TripOverview :trip-id="id" />
        </template>
        <template #routes>
          <TripRoutesPanel :trip-id="id" :trip-type="trip.type" />
        </template>
        <template #travelers>
          <TripTravelersPanel :trip-id="id" />
        </template>
        <template #itinerary>
          <TripItinerary :trip-id="id" />
        </template>
        <template #bookings>
          <TripBookingsPanel :trip-id="id" />
        </template>
        <template #expenses>
          <TripExpensesPanel :trip-id="id" />
        </template>
        <template #moments>
          <TripMomentsPanel :trip-id="id" />
        </template>
      </UTabs>
    </template>
  </div>
</template>
