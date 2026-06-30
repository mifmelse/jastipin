<script setup lang="ts">
// Uniform detail-page header: back link + identity card (avatar/icon + title +
// badges + key meta) with a slot for the primary action (destructive separated).
withDefaults(
  defineProps<{
    back: string
    backLabel: string
    title: string
    subtitle?: string
    avatarUrl?: string | null
    icon?: string
    rounded?: string
    mono?: boolean
  }>(),
  { icon: 'i-lucide-file', rounded: 'rounded-xl', mono: false },
)
</script>

<template>
  <div class="space-y-3">
    <NuxtLink :to="back" class="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-primary">
      <UIcon name="i-lucide-arrow-left" class="size-4" /> {{ backLabel }}
    </NuxtLink>

    <div class="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div class="flex items-start gap-4">
        <MediaThumb :url="avatarUrl" :icon="icon" size="size-14" :rounded="rounded" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 :class="['text-xl font-semibold truncate', mono && 'font-mono']">{{ title }}</h1>
            <slot name="badges" />
          </div>
          <p v-if="subtitle" class="text-sm text-stone-500 mt-0.5 truncate">{{ subtitle }}</p>
          <div v-if="$slots.meta" class="mt-1 text-sm"><slot name="meta" /></div>
        </div>
        <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
