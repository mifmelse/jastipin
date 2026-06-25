<script setup lang="ts">
const tabs = [
  { label: 'Continents', slot: 'continents' as const, icon: 'i-lucide-globe' },
  { label: 'Countries', slot: 'countries' as const, icon: 'i-lucide-flag' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Geography</h1>
      <p class="text-sm text-gray-500">Master data benua & negara.</p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #continents>
        <GeographyContinentsPanel />
      </template>
      <template #countries>
        <GeographyCountriesPanel />
      </template>
    </UTabs>
  </div>
</template>
