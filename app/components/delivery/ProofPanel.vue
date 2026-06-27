<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Shipment = Database['public']['Tables']['shipments']['Row'] & {
  orders?: { code: string | null; customers?: { name: string } | null } | null
}

const { items, update } = useShipments()
const toast = useToast()

// proof matters once a shipment is on its way or arrived
const rows = computed(() =>
  (items.value as Shipment[] ?? []).filter((s) => ['in_transit', 'delivered'].includes(s.status)),
)
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')

const open = ref(false)
const saving = ref(false)
const active = ref<Shipment | null>(null)
const form = reactive({ delivered_at: '', recipient_signed: false, proof_url: '' })

function openProof(s: Shipment) {
  active.value = s
  Object.assign(form, {
    delivered_at: s.delivered_at ? s.delivered_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    recipient_signed: s.recipient_signed,
    proof_url: s.proof_url ?? '',
  })
  open.value = true
}

async function submit() {
  if (!active.value) return
  saving.value = true
  try {
    // saving proof also marks the shipment delivered (trigger closes order + items)
    await update(active.value.id, {
      status: 'delivered',
      delivered_at: form.delivered_at || new Date().toISOString(),
      recipient_signed: form.recipient_signed,
      proof_url: form.proof_url || null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Order</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Customer</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Diterima</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">TTD</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Bukti</th>
            <th class="px-3 py-2.5 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="s in rows" :key="s.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ s.orders?.code }}</td>
            <td class="px-3 py-2">{{ s.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2">
              <UBadge :color="shipmentStatusColor(s.status)" variant="soft" class="capitalize">{{ shipmentStatusLabel(s.status) }}</UBadge>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ fmtDate(s.delivered_at) }}</td>
            <td class="px-3 py-2">
              <UIcon v-if="s.recipient_signed" name="i-lucide-check" class="size-4 text-success" />
              <span v-else class="text-stone-400">—</span>
            </td>
            <td class="px-3 py-2">
              <a v-if="s.proof_url" :href="s.proof_url" target="_blank" class="text-primary text-xs underline">Lihat</a>
              <span v-else class="text-stone-400">—</span>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="primary" variant="soft" icon="i-lucide-camera" class="whitespace-nowrap" @click="openProof(s)">Bukti & selesai</UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada pengiriman yang berjalan.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="s in rows"
        :key="s.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ s.orders?.customers?.name ?? '—' }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ s.orders?.code }}</span>
          </div>
          <UBadge :color="shipmentStatusColor(s.status)" variant="soft" class="capitalize shrink-0">{{ shipmentStatusLabel(s.status) }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ fmtDate(s.delivered_at) }}</span>
          <span class="font-medium tabular-nums shrink-0">
            <UIcon v-if="s.recipient_signed" name="i-lucide-check" class="size-4 text-success align-middle" />
            <span v-else class="text-stone-400">TTD —</span>
          </span>
        </div>
      </div>
      <p v-if="!rows.length" class="text-center text-stone-400 text-sm py-6">Belum ada pengiriman yang berjalan.</p>
    </div>

    <UModal v-model:open="open" :title="active ? `Bukti — ${active.orders?.code}` : 'Bukti'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <UFormField label="Tgl diterima">
            <UInput v-model="form.delivered_at" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Tanda tangan penerima">
            <div class="flex items-center gap-2">
              <USwitch v-model="form.recipient_signed" />
              <span class="text-sm text-stone-500">Penerima sudah tanda tangan / konfirmasi</span>
            </div>
          </UFormField>
          <UFormField label="Foto bukti">
            <FileUpload v-model="form.proof_url" folder="moments" accept="image/*" />
          </UFormField>
          <p class="text-xs text-stone-400">Menyimpan = tandai <span class="font-medium">delivered</span> → order & semua itemnya ikut delivered.</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" @click="submit">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
