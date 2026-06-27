<script setup lang="ts">
// Topbar bell — live alerts derived from data (see useNotifications).
const { notifs, total } = useNotifications()
</script>

<template>
  <UPopover :content="{ align: 'end' }">
    <button
      class="relative inline-flex items-center justify-center size-9 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      aria-label="Notifikasi"
    >
      <UIcon name="i-lucide-bell" class="size-5" />
      <span v-if="total" class="absolute top-1.5 right-1.5 size-2 rounded-full bg-error ring-2 ring-white dark:ring-stone-900" />
    </button>

    <template #content>
      <div class="w-72 p-1.5">
        <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide px-2 py-1.5">Notifikasi</p>
        <NuxtLink
          v-for="n in notifs"
          :key="n.key"
          :to="n.to"
          class="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          <UIcon :name="n.icon" :class="['size-4 shrink-0', n.tone]" />
          <span class="text-sm">{{ n.label }}</span>
        </NuxtLink>
        <p v-if="!notifs.length" class="text-sm text-stone-400 text-center py-5">Tidak ada notifikasi 🎉</p>
      </div>
    </template>
  </UPopover>
</template>
