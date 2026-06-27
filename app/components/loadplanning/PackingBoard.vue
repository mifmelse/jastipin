<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ tripId: string }>()
const tripId = toRef(props, 'tripId')

type LoadItem = {
  id: string
  trip_route_id: string
  order_items?: {
    id: string
    qty: number
    item_name: string | null
    products?: { name: string } | null
    orders?: { code: string | null; customers?: { name: string } | null } | null
  } | null
}
type Luggage = Database['public']['Tables']['luggages']['Row'] & {
  luggage_types?: { name: string; max_weight_g: number | null; tare_weight_g: number | null } | null
  load_items?: LoadItem[]
}
type Packable = {
  id: string
  item_name: string | null
  qty: number
  products?: { name: string } | null
  orders?: { code: string | null; trip_route_id: string; customers?: { name: string } | null } | null
}

const { items: luggages, addLoadItem, removeLoadItem } = useLuggages(tripId)
const { items: packable } = usePackableItems(tripId)
const { items: sim } = useLuggageSimulation(tripId)
const { items: allLegs } = useAllLegs()
const user = useSupabaseUser()
const toast = useToast()

const legs = computed(() => (allLegs.value ?? []).filter((l) => l.trip_id === props.tripId))
const legOptions = computed(() => legs.value.map((l) => ({ label: legLabel(l as LegEmbed), value: l.id })))
const packableOptions = computed(() =>
  (packable.value as Packable[] ?? []).map((p) => ({
    label: `${p.orders?.code} · ${p.products?.name ?? p.item_name} ×${p.qty}`,
    value: p.id,
  })),
)
const itemLegMap = computed(() => {
  const m = new Map<string, string>()
  for (const p of (packable.value as Packable[] ?? [])) if (p.orders?.trip_route_id) m.set(p.id, p.orders.trip_route_id)
  return m
})

// per-luggage simulation lookup (shared with the Simulation tab)
type Sim = { luggage_id: string; loaded_weight_g: number; max_weight_g: number | null; tare_weight_g: number | null }
const simByLuggage = computed(() => {
  const m = new Map<string, Sim>()
  for (const s of (sim.value as Sim[] ?? [])) m.set(s.luggage_id, s)
  return m
})
function weightOf(l: Luggage) {
  const s = simByLuggage.value.get(l.id)
  const loaded = s?.loaded_weight_g ?? 0
  const tare = Number(l.luggage_types?.tare_weight_g ?? 0)
  const max = Number(l.luggage_types?.max_weight_g ?? 0)
  const total = loaded + tare
  return { total, max, over: max > 0 && total > max, pct: max > 0 ? Math.min(100, (total / max) * 100) : 0 }
}
const loadLabel = (li: LoadItem) =>
  `${li.order_items?.products?.name ?? li.order_items?.item_name ?? '(item)'} ×${li.order_items?.qty ?? 1}`

// --- add item modal ---
const open = ref(false)
const saving = ref(false)
const activeLuggage = ref<Luggage | null>(null)
const form = reactive({ order_item_id: '', trip_route_id: '' })
// default the leg to the item's own order leg when an item is picked
watch(() => form.order_item_id, (id) => {
  form.trip_route_id = itemLegMap.value.get(id) ?? legs.value[0]?.id ?? ''
})

function openAdd(l: Luggage) {
  activeLuggage.value = l
  Object.assign(form, { order_item_id: '', trip_route_id: '' })
  open.value = true
}
const canSave = computed(() => !!form.order_item_id && !!form.trip_route_id)

async function submit() {
  if (!activeLuggage.value) return
  saving.value = true
  try {
    await addLoadItem({
      luggage_id: activeLuggage.value.id,
      order_item_id: form.order_item_id,
      trip_route_id: form.trip_route_id,
      placed_by: user.value?.id ?? null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menambah', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function unpack(li: LoadItem) {
  try {
    await removeLoadItem(li.id)
  } catch (e) {
    toast.add({ title: 'Gagal mengeluarkan', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-stone-500">
      {{ (packable?.length ?? 0) }} barang siap dimuat. Barang boleh diacak lintas customer demi maksimalkan ruang.
    </p>

    <div v-if="!(luggages?.length)" class="text-sm text-stone-400 text-center py-10 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
      Belum ada luggage. Buat dulu di tab <span class="font-medium">Luggage</span>.
    </div>

    <div v-else class="flex gap-3 overflow-x-auto pb-2">
      <div v-for="l in (luggages as Luggage[])" :key="l.id" class="w-72 shrink-0 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div class="p-3 border-b border-stone-100 dark:border-stone-800 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p class="font-medium text-sm">{{ l.label }}</p>
            <UBadge :color="luggageStatusColor(l.status)" variant="soft" size="xs" class="capitalize">{{ l.status }}</UBadge>
          </div>
          <p class="text-xs text-stone-400">{{ l.luggage_types?.name }}</p>
          <div>
            <div class="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="weightOf(l).over ? 'bg-error' : 'bg-primary'"
                :style="{ width: `${weightOf(l).pct}%` }"
              />
            </div>
            <p class="text-xs mt-1" :class="weightOf(l).over ? 'text-error font-medium' : 'text-stone-500'">
              {{ formatKg(weightOf(l).total) }} / {{ formatKg(weightOf(l).max) }}
              <span v-if="weightOf(l).over"> · over!</span>
            </p>
          </div>
        </div>

        <div class="p-2 space-y-1">
          <div
            v-for="li in (l.load_items ?? [])"
            :key="li.id"
            class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/50"
          >
            <div class="min-w-0">
              <p class="truncate">{{ loadLabel(li) }}</p>
              <p class="text-xs text-stone-400 truncate">
                {{ li.order_items?.orders?.code }} · {{ li.order_items?.orders?.customers?.name }}
              </p>
            </div>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-x" aria-label="Keluarkan" @click="unpack(li)" />
          </div>
          <p v-if="!(l.load_items?.length)" class="text-xs text-stone-300 dark:text-stone-700 text-center py-3">kosong</p>
          <UButton size="xs" color="neutral" variant="soft" block icon="i-lucide-plus" @click="openAdd(l)">Tambah barang</UButton>
        </div>
      </div>
    </div>

    <UModal v-model:open="open" :title="activeLuggage ? `Tambah ke ${activeLuggage.label}` : 'Tambah barang'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Barang (siap di gudang)" required>
            <USelect v-model="form.order_item_id" :items="packableOptions" class="w-full" placeholder="Pilih barang…" />
          </UFormField>
          <UFormField label="Dibawa di leg" required help="Carry-over: pilih leg mana barang ini diangkut.">
            <USelect v-model="form.trip_route_id" :items="legOptions" class="w-full" />
          </UFormField>
          <p v-if="!packableOptions.length" class="text-xs text-stone-400">
            Tidak ada barang berstatus in_warehouse untuk trip ini.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canSave" @click="submit">Tambah</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
