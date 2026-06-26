<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { order, status, refresh } = useOrder(id)

const tabs = [
  { label: 'Order Info', slot: 'info' as const, icon: 'i-lucide-receipt' },
  { label: 'Items', slot: 'items' as const, icon: 'i-lucide-package' },
]
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/operations/orders"
      class="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" /> Orders
    </NuxtLink>

    <div v-if="status === 'pending' && !order" class="text-sm text-stone-400">Memuat…</div>
    <div v-else-if="!order" class="text-sm text-stone-400">Order tidak ditemukan.</div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-xl font-semibold font-mono">{{ order.code }}</h1>
        <span class="text-sm text-stone-500">{{ order.customers?.name }}</span>
        <UBadge :color="orderStatusColor(order.status)" variant="soft" class="capitalize">
          {{ order.status.replace('_', ' ') }}
        </UBadge>
        <span class="ml-auto text-sm font-semibold">{{ formatIDR(order.total_idr) }}</span>
      </div>

      <UTabs :items="tabs" class="w-full">
        <template #info>
          <OrderInfo :order="order" @saved="refresh" />
        </template>
        <template #items>
          <OrderItems :order-id="id" :currency="order.currency" @changed="refresh" />
        </template>
      </UTabs>
    </template>
  </div>
</template>
