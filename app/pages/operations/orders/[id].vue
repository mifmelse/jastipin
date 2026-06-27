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
    <div v-if="status === 'pending' && !order" class="text-sm text-stone-400">Memuat…</div>
    <div v-else-if="!order" class="text-sm text-stone-400">Order tidak ditemukan.</div>
    <template v-else>
      <DetailHeader
        back="/operations/orders"
        back-label="Orders"
        :title="order.code ?? 'Order'"
        :subtitle="order.customers?.name ?? undefined"
        icon="i-lucide-receipt"
        mono
      >
        <template #badges>
          <UBadge :color="orderStatusColor(order.status)" variant="soft" class="capitalize">
            {{ order.status.replace('_', ' ') }}
          </UBadge>
        </template>
        <template #meta>
          <span class="font-semibold text-primary">{{ formatIDR(order.total_idr) }}</span>
        </template>
      </DetailHeader>

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
