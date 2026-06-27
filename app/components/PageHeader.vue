<script setup lang="ts">
// Consistent page header: grape icon chip + Bricolage title + subtitle, with an
// actions slot (e.g. the "Tambah" button). Renders a real <h1> so existing
// heading-based tests/selectors keep working.
defineProps<{ title: string; subtitle?: string; icon?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="flex items-start gap-3">
      <div
        v-if="icon"
        class="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
      >
        <UIcon :name="icon" class="size-5" />
      </div>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-stone-500 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
