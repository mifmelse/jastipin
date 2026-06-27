<script setup lang="ts">
import type { Database } from '~/types/database.types'

type WarehouseItem = Database['public']['Tables']['warehouse_items']['Row'] & {
  order_items?: {
    qty: number
    item_name: string | null
    weight_g: number | null
    products?: { name: string } | null
    orders?: { code: string | null; customers?: { name: string } | null } | null
  } | null
}

const { items, update } = useWarehouseStock()
const toast = useToast()

const filterCondition = ref(NONE)
const activeFilter = computed(() => toNullable(filterCondition.value))
const rows = computed(() => {
  const list = (items.value ?? []) as WarehouseItem[]
  return activeFilter.value ? list.filter((w) => w.condition === activeFilter.value) : list
})

const itemLabel = (w: WarehouseItem) => w.order_items?.products?.name ?? w.order_items?.item_name ?? '(item)'
const effWeight = (w: WarehouseItem) => effectiveWeightG(w.weighed_g, w.order_items?.weight_g)
const fmtG = (n: number | null) => (n == null ? '—' : `${Number(n).toLocaleString('id-ID')} g`)
const conditionFilterOptions = [{ label: 'Semua kondisi', value: NONE }, ...WH_CONDITION_OPTIONS]

// --- edit modal ---
const open = ref(false)
const saving = ref(false)
const active = ref<WarehouseItem | null>(null)
const form = reactive({
  location: '',
  condition: 'good',
  weighed_g: '' as number | '',
  length_mm: '' as number | '',
  width_mm: '' as number | '',
  height_mm: '' as number | '',
  notes: '',
})

function openEdit(w: WarehouseItem) {
  active.value = w
  Object.assign(form, {
    location: w.location ?? '',
    condition: w.condition,
    weighed_g: w.weighed_g ?? '',
    length_mm: w.length_mm ?? '',
    width_mm: w.width_mm ?? '',
    height_mm: w.height_mm ?? '',
    notes: w.notes ?? '',
  })
  open.value = true
}

const num = (v: number | '') => (v === '' ? null : Number(v))

async function submit() {
  if (!active.value) return
  saving.value = true
  try {
    await update(active.value.id, {
      location: form.location.trim() || null,
      condition: form.condition,
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
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <span class="text-sm text-stone-500">Kondisi</span>
      <USelect v-model="filterCondition" :items="conditionFilterOptions" class="w-52" />
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 dark:bg-stone-800/40 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Order</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Item</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Qty</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Lokasi</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Berat aktual</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Kondisi</th>
            <th class="px-3 py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="w in rows" :key="w.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ w.order_items?.orders?.code }}</td>
            <td class="px-3 py-2">
              <div class="font-medium">{{ itemLabel(w) }}</div>
              <div class="text-xs text-stone-400">{{ w.order_items?.orders?.customers?.name }}</div>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">{{ w.order_items?.qty }}</td>
            <td class="px-3 py-2 text-stone-500">{{ w.location ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ fmtG(effWeight(w)) }}</td>
            <td class="px-3 py-2">
              <UBadge :color="warehouseConditionColor(w.condition)" variant="soft" class="capitalize">{{ w.condition }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit" @click="openEdit(w)" />
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">
              {{ activeFilter ? 'Tidak ada item untuk kondisi ini.' : 'Stok kosong.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="w in rows"
        :key="w.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ itemLabel(w) }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ w.order_items?.orders?.code }}</span>
          </div>
          <UBadge :color="warehouseConditionColor(w.condition)" variant="soft" class="capitalize shrink-0">{{ w.condition }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ w.location ?? '—' }} · qty {{ w.order_items?.qty }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ fmtG(effWeight(w)) }}</span>
        </div>
      </div>
      <p v-if="!rows.length" class="text-center text-stone-400 text-sm py-6">
        {{ activeFilter ? 'Tidak ada item untuk kondisi ini.' : 'Stok kosong.' }}
      </p>
    </div>

    <UModal v-model:open="open" :title="active ? `Stok — ${itemLabel(active)}` : 'Stok'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <p class="text-xs text-stone-500">
            {{ active.order_items?.orders?.code }} · {{ active.order_items?.orders?.customers?.name }} · qty {{ active.order_items?.qty }}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Lokasi / rak">
              <UInput v-model="form.location" class="w-full" />
            </UFormField>
            <UFormField label="Kondisi">
              <USelect v-model="form.condition" :items="WH_CONDITION_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Berat aktual (gram)">
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
