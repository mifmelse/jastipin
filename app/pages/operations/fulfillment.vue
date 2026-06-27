<script setup lang="ts">
const tabs = [
  { label: 'Sourcing', slot: 'sourcing' as const, icon: 'i-lucide-shopping-bag' },
  { label: 'Drop-in Intake', slot: 'dropin' as const, icon: 'i-lucide-package-check' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Fulfillment</h1>
      <p class="text-sm text-stone-500">Bagaimana barang sampai ke tangan kita — sourcing (belanja) & drop-in (titipan).</p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #sourcing><FulfillmentSourcingPanel /></template>
      <template #dropin><FulfillmentDropInPanel /></template>
    </UTabs>
  </div>
</template>
