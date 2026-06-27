<script setup lang="ts">
const tabs = [
  { label: 'Continents', slot: 'continents' as const, icon: 'i-lucide-globe' },
  { label: 'Countries', slot: 'countries' as const, icon: 'i-lucide-flag' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Geography" subtitle="Master data benua & negara." icon="i-lucide-globe" />

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
