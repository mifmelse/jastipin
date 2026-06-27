<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Shipment = Database['public']['Tables']['shipments']['Row'] & {
  orders?: { code: string | null; customers?: { name: string } | null; trip_route?: LegEmbed } | null
}

const { items, update } = useShipments()
const toast = useToast()

const byStatus = (st: string) => (items.value as Shipment[] ?? []).filter((s) => s.status === st)

async function move(s: Shipment, status: string) {
  try {
    await update(s.id, { status })
  } catch (e) {
    toast.add({ title: 'Gagal update status', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-2">
    <div v-for="st in SHIPMENT_STATUSES" :key="st" class="w-64 shrink-0">
      <div class="flex items-center justify-between px-1 pb-2">
        <UBadge :color="shipmentStatusColor(st)" variant="soft" class="capitalize">{{ shipmentStatusLabel(st) }}</UBadge>
        <span class="text-xs text-stone-400">{{ byStatus(st).length }}</span>
      </div>
      <div class="space-y-2">
        <div
          v-for="s in byStatus(st)"
          :key="s.id"
          class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-xs">{{ s.orders?.code }}</span>
            <span class="text-xs text-stone-400">{{ legLabel(s.orders?.trip_route ?? null) }}</span>
          </div>
          <p class="text-sm font-medium">{{ s.orders?.customers?.name ?? '—' }}</p>
          <p v-if="s.courier || s.tracking_no" class="text-xs text-stone-500">
            {{ s.courier }} <span v-if="s.tracking_no" class="font-mono">· {{ s.tracking_no }}</span>
          </p>
          <USelect
            :model-value="s.status"
            :items="SHIPMENT_STATUS_OPTIONS"
            size="xs"
            class="w-full"
            @update:model-value="(v: string) => move(s, v)"
          />
        </div>
        <p v-if="!byStatus(st).length" class="text-xs text-stone-300 dark:text-stone-700 text-center py-4">—</p>
      </div>
    </div>
  </div>
</template>
