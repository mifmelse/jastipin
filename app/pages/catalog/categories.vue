<script setup lang="ts">
const tabs = [
  { label: 'Categories', slot: 'categories' as const, icon: 'i-lucide-folder-tree' },
  { label: 'Sub-categories', slot: 'subs' as const, icon: 'i-lucide-folder' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Categories</h1>
      <p class="text-sm text-stone-500">Kategori produk & turunannya.</p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #categories>
        <CatalogCategoriesPanel />
      </template>
      <template #subs>
        <CatalogSubCategoriesPanel />
      </template>
    </UTabs>
  </div>
</template>
