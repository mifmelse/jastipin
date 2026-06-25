<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()

const { data: countries, error } = await useAsyncData('countries', async () => {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name, iso2, dial_code')
    .order('name')
  if (error) throw error
  return data
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold">Dashboard</h1>
      <p class="text-sm text-gray-500">Fondasi siap — koneksi Supabase aktif.</p>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">Countries</span>
          <UBadge color="neutral" variant="soft">{{ countries?.length ?? 0 }}</UBadge>
        </div>
      </template>

      <p v-if="error" class="text-sm text-red-500">{{ error.message }}</p>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        <div
          v-for="c in countries"
          :key="c.id"
          class="flex items-center gap-2 rounded border border-gray-200 dark:border-gray-800 px-2 py-1"
        >
          <span class="font-mono text-xs text-gray-400">{{ c.iso2 }}</span>
          <span>{{ c.name }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
