<script setup lang="ts">
const tabs = [
  { label: 'Shipments', slot: 'shipments' as const, icon: 'i-lucide-truck' },
  { label: 'Tracking', slot: 'tracking' as const, icon: 'i-lucide-route' },
  { label: 'Proof of Delivery', slot: 'proof' as const, icon: 'i-lucide-camera' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Delivery" subtitle="Last-mile ke penerima setelah barang tiba di tujuan." icon="i-lucide-truck" />

    <UTabs :items="tabs" class="w-full">
      <template #shipments><DeliveryShipmentsPanel /></template>
      <template #tracking><DeliveryTrackingPanel /></template>
      <template #proof><DeliveryProofPanel /></template>
    </UTabs>
  </div>
</template>
