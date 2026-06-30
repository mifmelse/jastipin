<script setup lang="ts">
type Post = { id: string; body: string | null; location: string | null; created_at: string; media: { url: string; type: string }[] }

const props = defineProps<{ tripId: string }>()
const { items, create, remove } = useTripMoments(props.tripId)
const { upload } = useUpload()
const toast = useToast()

const open = ref(false)
const saving = ref(false)
const uploading = ref(false)
const body = ref('')
const location = ref('')
const media = ref<{ url: string; type: string }[]>([])

function openCreate() {
  body.value = ''
  location.value = ''
  media.value = []
  open.value = true
}
async function onFiles(e: Event) {
  const files = [...((e.target as HTMLInputElement).files ?? [])]
  if (!files.length) return
  uploading.value = true
  try {
    for (const f of files) {
      const url = await upload(f, 'moments')
      media.value.push({ url, type: f.type.startsWith('video') ? 'video' : 'image' })
    }
  } catch (err) {
    toast.add({ title: 'Gagal upload', description: (err as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}
async function save() {
  saving.value = true
  try {
    await create(body.value, location.value, media.value)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal posting', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(post: Post) {
  if (!(await useConfirm().confirm({ title: 'Hapus moment', description: 'Hapus postingan ini?' }))) return
  try {
    await remove(post.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const canPost = computed(() => !!body.value.trim() || media.value.length > 0)
const fmtDate = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="space-y-3 pb-20">
    <div v-if="items?.length" class="space-y-3 max-w-xl">
      <article
        v-for="post in (items as Post[])"
        :key="post.id"
        class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-xs text-stone-500">
            <span>{{ fmtDate(post.created_at) }}</span>
            <span v-if="post.location" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-map-pin" class="size-3" />{{ post.location }}
            </span>
          </div>
          <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(post)" />
        </div>
        <p v-if="post.body" class="text-sm whitespace-pre-line">{{ post.body }}</p>
        <TripMomentGallery v-if="post.media?.length" :media="post.media" />
      </article>
    </div>
    <p v-else class="text-sm text-stone-400 text-center py-10">Belum ada moment.</p>

    <FabAdd label="Posting" @click="openCreate" />

    <UModal v-model:open="open" title="Moment baru">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Teks">
            <UTextarea v-model="body" :rows="3" class="w-full" placeholder="Lagi ngapain?" />
          </UFormField>
          <UFormField label="Lokasi">
            <UInput v-model="location" class="w-full" placeholder="mis. Shibuya, Tokyo" />
          </UFormField>
          <UFormField label="Foto/Video">
            <div class="space-y-2">
              <label
                class="inline-flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-stone-200 dark:border-stone-800 px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-900"
              >
                <UIcon name="i-lucide-image-plus" class="size-4" />
                {{ uploading ? 'Mengupload…' : 'Tambah media' }}
                <input type="file" accept="image/*,video/*" multiple class="hidden" @change="onFiles" />
              </label>
              <div v-if="media.length" class="grid grid-cols-4 gap-2">
                <div
                  v-for="(m, i) in media"
                  :key="i"
                  class="relative aspect-square overflow-hidden rounded bg-stone-100 dark:bg-stone-800"
                >
                  <video v-if="m.type === 'video'" :src="m.url" class="w-full h-full object-cover" />
                  <img v-else :src="m.url" alt="" class="w-full h-full object-cover" />
                  <button
                    class="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white text-xs"
                    @click="media.splice(i, 1)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canPost || uploading" @click="save">Posting</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
