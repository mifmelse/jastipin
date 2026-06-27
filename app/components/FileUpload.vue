<script setup lang="ts">
const url = defineModel<string>({ default: '' })
const props = withDefaults(
  defineProps<{ accept?: string; folder?: string }>(),
  { accept: 'image/*,application/pdf', folder: '' },
)

const { upload } = useUpload()
const { open: openMedia } = useMediaViewer()
const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement>()

const isImage = computed(() => !!url.value && /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url.value))

async function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    url.value = await upload(file, props.folder)
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <UButton
        size="sm"
        color="neutral"
        variant="soft"
        icon="i-lucide-upload"
        :loading="uploading"
        @click="fileInput?.click()"
      >
        {{ url ? 'Ganti file' : 'Upload' }}
      </UButton>
      <UButton
        v-if="url"
        size="sm"
        color="error"
        variant="ghost"
        icon="i-lucide-x"
        @click="url = ''"
      >
        Hapus
      </UButton>
      <input ref="fileInput" type="file" :accept="accept" class="hidden" @change="onChange" />
    </div>
    <button
      v-if="isImage"
      type="button"
      class="block"
      aria-label="Lihat gambar"
      @click="openMedia({ url })"
    >
      <img :src="url" class="max-h-32 rounded-lg border border-stone-200 dark:border-stone-800 cursor-zoom-in" />
    </button>
    <button
      v-else-if="url"
      type="button"
      class="inline-block text-sm text-primary underline truncate max-w-full"
      @click="openMedia({ url })"
    >
      Lihat file
    </button>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
