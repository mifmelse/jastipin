<script setup lang="ts">
const tabs = [
  { label: 'Pipeline', slot: 'pipeline' as const, icon: 'i-lucide-kanban' },
  { label: 'Contacts', slot: 'contacts' as const, icon: 'i-lucide-users-round' },
  { label: 'Activities', slot: 'activities' as const, icon: 'i-lucide-activity' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">CRM</h1>
      <p class="text-sm text-stone-500">Funnel customer: reach → lead → conversation → order → repeat.</p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #pipeline><CrmPipelineBoard /></template>
      <template #contacts><CrmContactsPanel /></template>
      <template #activities><CrmActivitiesPanel /></template>
    </UTabs>
  </div>
</template>
