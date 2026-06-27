<script setup lang="ts">
const tabs = [
  { label: 'Inbound / Intake', slot: 'intake' as const, icon: 'i-lucide-inbox' },
  { label: 'Stock', slot: 'stock' as const, icon: 'i-lucide-boxes' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Warehouse</h1>
      <p class="text-sm text-stone-500">Barang diam di gudang — intake, timbang aktual, stok, kondisi.</p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #intake><WarehouseIntakePanel /></template>
      <template #stock><WarehouseStockPanel /></template>
    </UTabs>
  </div>
</template>
