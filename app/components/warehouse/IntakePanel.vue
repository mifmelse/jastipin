<script setup lang="ts">
type Row = {
  id: string
  qty: number
  item_name: string | null
  status: string
  weight_g: number | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  products?: { name: string; weight_g: number | null } | null
  orders?: { code: string | null; customers?: { name: string } | null } | null
}

const { items, receive } = useWarehouseIntake()
const user = useSupabaseUser()
const toast = useToast()

const itemLabel = (r: Row) => r.products?.name ?? r.item_name ?? '(item)'
const estWeight = (r: Row) => r.weight_g ?? r.products?.weight_g ?? null

// --- intake modal ---
const open = ref(false)
const saving = ref(false)
const active = ref<Row | null>(null)
const form = reactive({
  location: '',
  condition: 'good',
  weighed_g: '' as number | '',
  length_mm: '' as number | '',
  width_mm: '' as number | '',
  height_mm: '' as number | '',
  notes: '',
})

function openIntake(r: Row) {
  active.value = r
  Object.assign(form, {
    location: '',
    condition: 'good',
    weighed_g: estWeight(r) ?? '', // prefill with the estimate as a starting point
    length_mm: r.length_mm ?? '',
    width_mm: r.width_mm ?? '',
    height_mm: r.height_mm ?? '',
    notes: '',
  })
  open.value = true
}

const num = (v: number | '') => (v === '' ? null : Number(v))

async function submit() {
  if (!active.value) return
  saving.value = true
  try {
    await receive(active.value.id, {
      location: form.location.trim() || null,
      condition: form.condition,
      intake_by: user.value?.id ?? null,
      weighed_g: num(form.weighed_g),
      length_mm: num(form.length_mm),
      width_mm: num(form.width_mm),
      height_mm: num(form.height_mm),
      notes: form.notes.trim() || null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const fmtG = (n: number | null) => (n == null ? '—' : `${Number(n).toLocaleString('id-ID')} g`)
</script>

<template>
  <div class="space-y-3">
    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Order</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Customer</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Item</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Qty</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Asal</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Berat estimasi</th>
            <th class="px-3 py-2.5 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="r in (items as Row[]) ?? []" :key="r.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ r.orders?.code }}</td>
            <td class="px-3 py-2">{{ r.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2 font-medium">{{ itemLabel(r) }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ r.qty }}</td>
            <td class="px-3 py-2">
              <UBadge :color="r.status === 'purchased' ? 'info' : 'neutral'" variant="soft">
                {{ r.status === 'purchased' ? 'sourcing' : 'drop-in' }}
              </UBadge>
            </td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ fmtG(estWeight(r)) }}</td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="primary" variant="soft" icon="i-lucide-scale" @click="openIntake(r)">Terima & timbang</UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Tidak ada item menunggu intake.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="r in (items as Row[]) ?? []"
        :key="r.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ itemLabel(r) }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ r.orders?.code }}</span>
          </div>
          <UBadge :color="r.status === 'purchased' ? 'info' : 'neutral'" variant="soft" class="shrink-0">
            {{ r.status === 'purchased' ? 'sourcing' : 'drop-in' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ r.orders?.customers?.name ?? '—' }} · qty {{ r.qty }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ fmtG(estWeight(r)) }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Tidak ada item menunggu intake.</p>
    </div>

    <UModal v-model:open="open" :title="active ? `Intake — ${itemLabel(active)}` : 'Intake'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <p class="text-xs text-stone-500">
            {{ active.orders?.code }} · {{ active.orders?.customers?.name }} · qty {{ active.qty }}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Lokasi / rak">
              <UInput v-model="form.location" class="w-full" placeholder="mis. Rak A-3" />
            </UFormField>
            <UFormField label="Kondisi">
              <USelect v-model="form.condition" :items="WH_CONDITION_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Berat aktual (gram)" help="Mengalahkan estimasi untuk packing.">
              <UInput v-model.number="form.weighed_g" type="number" class="w-full" />
            </UFormField>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <UFormField label="Panjang (mm)"><UInput v-model.number="form.length_mm" type="number" class="w-full" /></UFormField>
            <UFormField label="Lebar (mm)"><UInput v-model.number="form.width_mm" type="number" class="w-full" /></UFormField>
            <UFormField label="Tinggi (mm)"><UInput v-model.number="form.height_mm" type="number" class="w-full" /></UFormField>
          </div>
          <UFormField label="Catatan">
            <UInput v-model="form.notes" class="w-full" />
          </UFormField>
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
