<script setup lang="ts">
// Inline lightbox for image/video/pdf, with prev/next for multiple media.
const { items, index, isOpen, close, next, prev } = useMediaViewer()

const current = computed(() => items.value[index.value])
const kind = computed(() => (current.value ? mediaKind(current.value.url, current.value.type) : 'other'))
const hasMany = computed(() => items.value.length > 1)

function onKey(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-3xl' }">
    <template #content>
      <div class="relative rounded-lg overflow-hidden bg-stone-950">
        <button
          class="absolute top-2 right-2 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Tutup"
          @click="close"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>

        <div class="flex items-center justify-center min-h-[45vh] max-h-[82vh] p-2">
          <img v-if="current && kind === 'image'" :src="current.url" alt="" class="max-h-[80vh] max-w-full object-contain" />
          <video v-else-if="current && kind === 'video'" :src="current.url" controls autoplay class="max-h-[80vh] max-w-full" />
          <iframe v-else-if="current && kind === 'pdf'" :src="current.url" class="w-full h-[80vh] bg-white" />
          <a v-else-if="current" :href="current.url" target="_blank" class="text-white underline text-sm">Buka file</a>
        </div>

        <template v-if="hasMany">
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
            aria-label="Sebelumnya" :disabled="index === 0" @click="prev"
          >
            <UIcon name="i-lucide-chevron-left" class="size-5" />
          </button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
            aria-label="Berikutnya" :disabled="index === items.length - 1" @click="next"
          >
            <UIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
            {{ index + 1 }} / {{ items.length }}
          </div>
        </template>
      </div>
    </template>
  </UModal>
</template>
