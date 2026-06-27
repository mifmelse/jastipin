<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Shipment = Database['public']['Tables']['shipments']['Row'] & {
  orders?: { code: string | null; status: string; customers?: { name: string } | null; trip_route?: LegEmbed } | null
}

const { items, create, update, remove } = useShipments()
const { items: orders } = useOrders()
const toast = useToast()

// orders still in flight can get a shipment
const eligibleOrders = computed(() =>
  (orders.value ?? []).filter((o) => !['completed', 'cancelled', 'refunded'].includes(o.status)),
)
const orderOptions = computed(() =>
  eligibleOrders.value.map((o) => ({ label: `${o.code} · ${o.customers?.name ?? '—'}`, value: o.id })),
)
const orderLeg = computed(() => {
  const m = new Map<string, string>()
  for (const o of eligibleOrders.value) if (o.id && o.trip_route_id) m.set(o.id, o.trip_route_id)
  return m
})

// --- create ---
const open = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ order_id: '', courier: '', tracking_no: '', status: 'pending' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { order_id: '', courier: '', tracking_no: '', status: 'pending' })
  open.value = true
}
function openEdit(s: Shipment) {
  editingId.value = s.id
  Object.assign(form, {
    order_id: s.order_id,
    courier: s.courier ?? '',
    tracking_no: s.tracking_no ?? '',
    status: s.status,
  })
  open.value = true
}
const canSave = computed(() => !!form.order_id)

async function save() {
  saving.value = true
  try {
    if (editingId.value) {
      await update(editingId.value, {
        courier: form.courier.trim() || null,
        tracking_no: form.tracking_no.trim() || null,
        status: form.status,
      })
    } else {
      const legId = orderLeg.value.get(form.order_id)
      if (!legId) throw new Error('Order tidak punya leg pengantaran.')
      await create({
        order_id: form.order_id,
        trip_route_id: legId,
        courier: form.courier.trim() || null,
        tracking_no: form.tracking_no.trim() || null,
        status: form.status,
      })
    }
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(s: Shipment) {
  if (!(await useConfirm().confirm({ title: 'Hapus shipment', description: `Hapus pengiriman ${s.orders?.code}?` }))) return
  try {
    await remove(s.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" @click="openCreate">Buat shipment</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Order</th>
            <th class="px-3 py-2 font-medium">Customer</th>
            <th class="px-3 py-2 font-medium">Leg</th>
            <th class="px-3 py-2 font-medium">Courier</th>
            <th class="px-3 py-2 font-medium">Resi</th>
            <th class="px-3 py-2 font-medium">Status</th>
            <th class="px-3 py-2 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="s in (items as Shipment[]) ?? []" :key="s.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ s.orders?.code }}</td>
            <td class="px-3 py-2">{{ s.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ legLabel(s.orders?.trip_route ?? null) }}</td>
            <td class="px-3 py-2 text-stone-500">{{ s.courier ?? '—' }}</td>
            <td class="px-3 py-2 font-mono text-xs">{{ s.tracking_no ?? '—' }}</td>
            <td class="px-3 py-2">
              <UBadge :color="shipmentStatusColor(s.status)" variant="soft" class="capitalize">{{ shipmentStatusLabel(s.status) }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end gap-1">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit shipment" @click="openEdit(s)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus shipment" @click="onDelete(s)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada shipment.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editingId ? 'Edit Shipment' : 'Buat Shipment'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Order" required>
            <USelect v-model="form.order_id" :items="orderOptions" class="w-full" :disabled="!!editingId" placeholder="Pilih order…" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Courier">
              <UInput v-model="form.courier" class="w-full" placeholder="mis. JNE / GoSend" />
            </UFormField>
            <UFormField label="No. resi">
              <UInput v-model="form.tracking_no" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="form.status" :items="SHIPMENT_STATUS_OPTIONS" class="w-full" />
            </UFormField>
          </div>
          <p v-if="!editingId" class="text-xs text-stone-400">Leg pengantaran otomatis dari leg order.</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canSave" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
