<script setup lang="ts">
const { state, resolve } = useConfirm()
</script>

<template>
  <UModal
    :open="state.open"
    :title="state.title"
    :ui="{ content: 'max-w-sm' }"
    @update:open="(v: boolean) => { if (!v) resolve(false) }"
  >
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">{{ state.description }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="resolve(false)">
          {{ state.cancelLabel }}
        </UButton>
        <UButton :color="state.color" @click="resolve(true)">
          {{ state.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
