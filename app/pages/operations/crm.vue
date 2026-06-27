<script setup lang="ts">
const route = useRoute()
const tabs = [
  { label: 'Pipeline', slot: 'pipeline' as const, value: 'pipeline', icon: 'i-lucide-kanban' },
  { label: 'Contacts', slot: 'contacts' as const, value: 'contacts', icon: 'i-lucide-users-round' },
  { label: 'Activities', slot: 'activities' as const, value: 'activities', icon: 'i-lucide-activity' },
]
// allow deep-link to a tab, e.g. /operations/crm?tab=contacts (command palette)
const active = ref(String(route.query.tab ?? 'pipeline'))
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="CRM" subtitle="Funnel customer: reach → lead → conversation → order → repeat." icon="i-lucide-users-round" />

    <UTabs v-model="active" :items="tabs" class="w-full">
      <template #pipeline><CrmPipelineBoard /></template>
      <template #contacts><CrmContactsPanel /></template>
      <template #activities><CrmActivitiesPanel /></template>
    </UTabs>
  </div>
</template>
