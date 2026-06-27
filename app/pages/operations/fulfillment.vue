<script setup lang="ts">
const tabs = [
  { label: 'Sourcing', slot: 'sourcing' as const, icon: 'i-lucide-shopping-bag' },
  { label: 'Drop-in Intake', slot: 'dropin' as const, icon: 'i-lucide-package-check' },
]
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Fulfillment" subtitle="Bagaimana barang sampai ke tangan kita — sourcing (belanja) & drop-in (titipan)." icon="i-lucide-hand-helping" />

    <UTabs :items="tabs" class="w-full">
      <template #sourcing><FulfillmentSourcingPanel /></template>
      <template #dropin><FulfillmentDropInPanel /></template>
    </UTabs>
  </div>
</template>
