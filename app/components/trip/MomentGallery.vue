<script setup lang="ts">
const props = defineProps<{ media: { url: string; type: string }[] }>()

// >4 → show first 3 + a "+N" tile; ≤4 → show all in a grid.
const shown = computed(() => (props.media.length > 4 ? props.media.slice(0, 3) : props.media))
const extra = computed(() => (props.media.length > 4 ? props.media.length - 3 : 0))
const cols = computed(() => {
  const n = props.media.length > 4 ? 4 : props.media.length
  return n === 1 ? 'grid-cols-1' : n === 3 ? 'grid-cols-3' : 'grid-cols-2'
})
</script>

<template>
  <div :class="['grid gap-1', cols]">
    <div
      v-for="(m, i) in shown"
      :key="i"
      class="relative aspect-square overflow-hidden rounded bg-stone-100 dark:bg-stone-800"
    >
      <video v-if="m.type === 'video'" :src="m.url" class="w-full h-full object-cover" controls />
      <img v-else :src="m.url" alt="" class="w-full h-full object-cover" />
    </div>

    <div v-if="extra > 0" class="relative aspect-square overflow-hidden rounded bg-stone-900">
      <img :src="media[3].url" alt="" class="w-full h-full object-cover opacity-50" />
      <div class="absolute inset-0 flex items-center justify-center text-white text-xl font-semibold">
        +{{ extra }}
      </div>
    </div>
  </div>
</template>
