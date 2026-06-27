<script setup lang="ts">
const tabs = [
  { label: 'Categories', slot: 'categories' as const, icon: 'i-lucide-folder-tree' },
  { label: 'Sub-categories', slot: 'subs' as const, icon: 'i-lucide-folder' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Categories" subtitle="Kategori produk & turunannya." icon="i-lucide-folder-tree" />

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
