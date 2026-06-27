<script setup lang="ts">
// Inline lightbox for image/video/pdf, with prev/next for multiple media.
// Rendered as a body-teleported fixed overlay with a very high z-index so it
// always sits ABOVE any open UModal (e.g. opening a payment proof from inside
// the receivables payment modal) — @nuxt/ui modals have no explicit z-index, so
// a nested UModal could get covered. Teleport + z-[100] is bulletproof.
const { items, index, isOpen, close, next, prev } = useMediaViewer()

const current = computed(() => items.value[index.value])
const kind = computed(() => (current.value ? mediaKind(current.value.url, current.value.type) : 'other'))
const hasMany = computed(() => items.value.length > 1)

function onKey(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    // Capture-phase + stopImmediate so the underlying modal's own Esc handler
    // doesn't also fire (closing the payment modal beneath the lightbox).
    e.stopImmediatePropagation()
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}
// capture phase: intercept Esc before the underlying Reka dialog sees it
onMounted(() => window.addEventListener('keydown', onKey, true))
onUnmounted(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <button
        class="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Tutup"
        @click="close"
      >
        <UIcon name="i-lucide-x" class="size-5" />
      </button>

      <div class="flex items-center justify-center max-h-[88vh] max-w-3xl w-full" @click.self="close">
        <img v-if="current && kind === 'image'" :src="current.url" alt="" class="max-h-[85vh] max-w-full object-contain rounded" />
        <video v-else-if="current && kind === 'video'" :src="current.url" controls autoplay class="max-h-[85vh] max-w-full rounded" />
        <iframe v-else-if="current && kind === 'pdf'" :src="current.url" class="w-full h-[85vh] bg-white rounded" />
        <a v-else-if="current" :href="current.url" target="_blank" class="text-white underline text-sm">Buka file</a>
      </div>

      <template v-if="hasMany">
        <button
          class="absolute left-3 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
          aria-label="Sebelumnya" :disabled="index === 0" @click="prev"
        >
          <UIcon name="i-lucide-chevron-left" class="size-5" />
        </button>
        <button
          class="absolute right-3 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
          aria-label="Berikutnya" :disabled="index === items.length - 1" @click="next"
        >
          <UIcon name="i-lucide-chevron-right" class="size-5" />
        </button>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
          {{ index + 1 }} / {{ items.length }}
        </div>
      </template>
    </div>
  </Teleport>
</template>
