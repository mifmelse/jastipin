<script setup lang="ts">
// Floating action button — sits bottom-right of the viewport instead of
// stacking above/below the content.
defineProps<{ label?: string }>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <UButton
    class="fixed bottom-6 right-6 z-30 rounded-full shadow-lg"
    size="lg"
    icon="i-lucide-plus"
    @click="emit('click')"
  >
    <span class="hidden sm:inline">{{ label ?? 'Tambah' }}</span>
  </UButton>
</template>
