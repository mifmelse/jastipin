<script setup lang="ts">
type Activity = {
  id: string
  type: string
  content: string | null
  created_at: string
  crm_pipeline?: { contact_name: string | null; customers?: { name: string } | null } | null
}

const { items } = useRecentActivities()

const leadName = (a: Activity) =>
  a.crm_pipeline?.customers?.name ?? a.crm_pipeline?.contact_name ?? '—'
const fmt = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="space-y-2 max-w-2xl">
    <template v-if="items?.length">
      <div
        v-for="a in (items as Activity[])"
        :key="a.id"
        class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <UBadge color="neutral" variant="soft">{{ a.type }}</UBadge>
          <span class="font-medium text-stone-700 dark:text-stone-300">{{ leadName(a) }}</span>
          <span>{{ fmt(a.created_at) }}</span>
        </div>
        <p v-if="a.content" class="text-sm mt-1">{{ a.content }}</p>
      </div>
    </template>
    <p v-else class="text-sm text-stone-400 text-center py-10">Belum ada activity.</p>
  </div>
</template>
