<script setup lang="ts">
// Small clickable thumbnail → opens the MediaViewer. Placeholder icon when empty.
const props = withDefaults(
  defineProps<{ url?: string | null; size?: string; rounded?: string; icon?: string }>(),
  { size: 'size-9', rounded: 'rounded-md', icon: 'i-lucide-image' },
)
const { open } = useMediaViewer()
</script>

<template>
  <button
    v-if="url"
    type="button"
    :class="['shrink-0 overflow-hidden border border-stone-200 dark:border-stone-800 cursor-zoom-in', size, rounded]"
    aria-label="Lihat gambar"
    @click.stop="open({ url })"
  >
    <img :src="url" alt="" class="w-full h-full object-cover" />
  </button>
  <div
    v-else
    :class="['shrink-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-400', size, rounded]"
  >
    <UIcon :name="icon" class="size-4" />
  </div>
</template>
