<script setup lang="ts">
const props = defineProps<{ pipelineId: string; title: string }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const { items, create, remove } = useCrmActivities(props.pipelineId)
const user = useSupabaseUser()
const toast = useToast()

const open = ref(true)
watch(open, (v) => {
  if (!v) emit('close')
})

const type = ref('note')
const content = ref('')
const saving = ref(false)

async function add() {
  if (!content.value.trim()) return
  saving.value = true
  try {
    await create({
      pipeline_id: props.pipelineId,
      type: type.value,
      content: content.value.trim(),
      created_by: user.value?.id ?? null,
    })
    content.value = ''
    emit('changed')
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(id: string) {
  try {
    await remove(id)
    emit('changed')
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
const fmt = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <UModal v-model:open="open" :title="`Activities — ${title}`">
    <template #body>
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
          <UFormField label="Type" class="sm:w-36">
            <USelect v-model="type" :items="CRM_ACTIVITY_OPTIONS" class="w-full" />
          </UFormField>
          <UFormField label="Catatan" class="flex-1">
            <UInput v-model="content" class="w-full" placeholder="mis. follow up WA" @keyup.enter="add" />
          </UFormField>
          <UButton :loading="saving" :disabled="!content.trim()" icon="i-lucide-plus" @click="add">Tambah</UButton>
        </div>

        <div v-if="items?.length" class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="a in items"
            :key="a.id"
            class="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2"
          >
            <div class="text-sm min-w-0">
              <UBadge color="neutral" variant="soft" class="mr-2">{{ a.type }}</UBadge>
              <span>{{ a.content }}</span>
              <p class="text-xs text-stone-400 mt-0.5">{{ fmt(a.created_at) }}</p>
            </div>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(a.id)" />
          </div>
        </div>
        <p v-else class="text-sm text-stone-400 text-center py-4">Belum ada activity.</p>
      </div>
    </template>
  </UModal>
</template>
