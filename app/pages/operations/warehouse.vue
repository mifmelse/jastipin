<script setup lang="ts">
const tabs = [
  { label: 'Inbound / Intake', slot: 'intake' as const, icon: 'i-lucide-inbox' },
  { label: 'Stock', slot: 'stock' as const, icon: 'i-lucide-boxes' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Warehouse" subtitle="Barang diam di gudang — intake, timbang aktual, stok, kondisi." icon="i-lucide-warehouse" />

    <UTabs :items="tabs" class="w-full">
      <template #intake><WarehouseIntakePanel /></template>
      <template #stock><WarehouseStockPanel /></template>
    </UTabs>
  </div>
</template>
