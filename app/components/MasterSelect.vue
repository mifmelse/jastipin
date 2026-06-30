<script setup lang="ts">
import type { MasterTable } from '~/composables/useSimpleMaster'

// Picks a value from an A4 master, but writes the NAME as a text snapshot (the
// operations columns stay text — see useSimpleMaster). Keeps the current value
// visible even if it's no longer an active master, so old snapshots never blank.
const props = defineProps<{ table: MasterTable; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
const { items } = useSimpleMaster(props.table)

const options = computed(() => {
  const names = (items.value ?? []).filter((m) => m.is_active).map((m) => m.name)
  if (model.value && !names.includes(model.value)) names.unshift(model.value)
  return names.map((n) => ({ label: n, value: n }))
})
</script>

<template>
  <USelect v-model="model" :items="options" :placeholder="placeholder ?? 'Pilih…'" class="w-full" />
</template>
