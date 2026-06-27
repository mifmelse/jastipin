<script setup lang="ts">
import type { Database } from '~/types/database.types'
import draggable from 'vuedraggable'

// Workspace scoped to ONE route (B2). Drag items from the queue into a luggage,
// or between luggages, to pack them (B3). Tap buttons remain as a fallback.
const props = defineProps<{ tripId: string; routeId: string | null }>()
const tripId = toRef(props, 'tripId')

type LoadItem = {
  id: string
  trip_route_id: string
  order_items?: {
    id: string
    qty: number
    item_name: string | null
    weight_g: number | null
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
  weight_g: number | null
  products?: { name: string } | null
  orders?: { code: string | null; trip_route_id: string; customers?: { name: string } | null } | null
}
type Card = { key: string; orderItemId: string; loadItemId: string | null; title: string; sub: string }
type DragChange = {
  added?: { element: Card }
  removed?: { element: Card }
}

const { can } = useCan()
const { items: luggages, addLoadItem, removeLoadItem } = useLuggages(tripId)
const { items: packable } = usePackableItems(tripId)
const user = useSupabaseUser()
const toast = useToast()

const routePackable = computed(() =>
  (packable.value as Packable[] ?? []).filter((p) => p.orders?.trip_route_id === props.routeId),
)
function routeItems(l: Luggage): LoadItem[] {
  return (l.load_items ?? []).filter((li) => li.trip_route_id === props.routeId)
}
function weightOf(l: Luggage) {
  const loaded = routeItems(l).reduce(
    (s, li) => s + Number(li.order_items?.weight_g ?? 0) * Number(li.order_items?.qty ?? 1),
    0,
  )
  const tare = Number(l.luggage_types?.tare_weight_g ?? 0)
  const max = Number(l.luggage_types?.max_weight_g ?? 0)
  const total = loaded + tare
  return { total, max, over: max > 0 && total > max, pct: max > 0 ? Math.min(100, (total / max) * 100) : 0 }
}

// --- draggable lists (rebuilt from server data) ---
const pool = ref<Card[]>([])
const byLuggage = reactive<Record<string, Card[]>>({})
const itemTitle = (oi: Packable | NonNullable<LoadItem['order_items']>) =>
  `${oi.products?.name ?? oi.item_name ?? '(item)'} ×${oi.qty}`

watchEffect(() => {
  pool.value = routePackable.value.map((p) => ({
    key: `p-${p.id}`,
    orderItemId: p.id,
    loadItemId: null,
    title: itemTitle(p),
    sub: `${p.orders?.code ?? ''} · ${p.orders?.customers?.name ?? ''}`,
  }))
  for (const l of (luggages.value as Luggage[]) ?? []) {
    byLuggage[l.id] = routeItems(l).map((li) => ({
      key: `li-${li.id}`,
      orderItemId: li.order_items?.id ?? '',
      loadItemId: li.id,
      title: li.order_items ? itemTitle(li.order_items) : '(item)',
      sub: `${li.order_items?.orders?.code ?? ''} · ${li.order_items?.orders?.customers?.name ?? ''}`,
    }))
  }
})

const dragEnabled = computed(() => can('load_planning.write') && !!props.routeId)

async function place(luggageId: string, card: Card) {
  // moving from another luggage → drop the old placement first
  if (card.loadItemId) await removeLoadItem(card.loadItemId)
  await addLoadItem({
    luggage_id: luggageId,
    order_item_id: card.orderItemId,
    trip_route_id: props.routeId!,
    placed_by: user.value?.id ?? null,
  })
}
async function onLuggageChange(luggageId: string, e: DragChange) {
  if (!e.added) return // removals are handled by the destination
  try {
    await place(luggageId, e.added.element)
  } catch (err) {
    toast.add({ title: 'Gagal memindah', description: (err as Error).message, color: 'error' })
  }
}
async function onPoolChange(e: DragChange) {
  if (!e.added?.element.loadItemId) return // came from a luggage → unpack
  try {
    await removeLoadItem(e.added.element.loadItemId)
  } catch (err) {
    toast.add({ title: 'Gagal mengeluarkan', description: (err as Error).message, color: 'error' })
  }
}
async function unpack(loadItemId: string) {
  try {
    await removeLoadItem(loadItemId)
  } catch (e) {
    toast.add({ title: 'Gagal mengeluarkan', description: (e as Error).message, color: 'error' })
  }
}

// --- tap fallback (mobile): pick an item into a luggage ---
const open = ref(false)
const saving = ref(false)
const activeLuggage = ref<Luggage | null>(null)
const form = reactive({ order_item_id: '' })
const packableOptions = computed(() => pool.value.map((c) => ({ label: c.title, value: c.orderItemId })))
function openAdd(l: Luggage) {
  activeLuggage.value = l
  form.order_item_id = ''
  open.value = true
}
async function submit() {
  if (!activeLuggage.value || !props.routeId) return
  saving.value = true
  try {
    await addLoadItem({
      luggage_id: activeLuggage.value.id,
      order_item_id: form.order_item_id,
      trip_route_id: props.routeId,
      placed_by: user.value?.id ?? null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menambah', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="!routeId" class="text-sm text-stone-400 text-center py-16 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
      Pilih <span class="font-medium">route</span> dulu untuk mulai packing leg ini.
    </p>

    <template v-else>
      <p class="text-xs text-stone-500">
        {{ pool.length }} barang siap dimuat di route ini. Seret kartu ke koper, atau pakai tombol.
      </p>

      <div class="flex gap-3 overflow-x-auto pb-2 items-start">
        <!-- queue -->
        <div class="w-64 shrink-0 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40">
          <div class="p-3 border-b border-stone-100 dark:border-stone-800">
            <p class="font-medium text-sm">Barang siap (queue)</p>
            <p class="text-xs text-stone-400">in_warehouse · route ini</p>
          </div>
          <draggable
            :list="pool"
            :group="{ name: 'items' }"
            item-key="key"
            :disabled="!dragEnabled"
            class="p-2 space-y-1 min-h-[60px]"
            ghost-class="opacity-40"
            @change="onPoolChange"
          >
            <template #item="{ element }">
              <div class="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing">
                <p class="truncate">{{ element.title }}</p>
                <p class="text-xs text-stone-400 truncate">{{ element.sub }}</p>
              </div>
            </template>
          </draggable>
          <p v-if="!pool.length" class="text-xs text-stone-300 dark:text-stone-700 text-center pb-3">kosong</p>
        </div>

        <div v-if="!(luggages?.length)" class="text-sm text-stone-400 text-center py-10 px-6 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
          Belum ada luggage. Buat dulu di tab <span class="font-medium">Luggage</span>.
        </div>

        <!-- luggages -->
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

          <draggable
            :list="byLuggage[l.id]"
            :group="{ name: 'items' }"
            item-key="key"
            :disabled="!dragEnabled"
            class="p-2 space-y-1 min-h-[48px]"
            ghost-class="opacity-40"
            @change="(e: DragChange) => onLuggageChange(l.id, e)"
          >
            <template #item="{ element }">
              <div class="flex items-center justify-between gap-2 rounded-md border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 px-2 py-1.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-grab active:cursor-grabbing">
                <div class="min-w-0">
                  <p class="truncate">{{ element.title }}</p>
                  <p class="text-xs text-stone-400 truncate">{{ element.sub }}</p>
                </div>
                <UButton v-if="can('load_planning.write')" size="xs" color="error" variant="ghost" icon="i-lucide-x" aria-label="Keluarkan" @click="unpack(element.loadItemId)" />
              </div>
            </template>
          </draggable>
          <div class="p-2 pt-0">
            <p v-if="!(byLuggage[l.id]?.length)" class="text-xs text-stone-300 dark:text-stone-700 text-center py-2">tarik barang ke sini</p>
            <UButton v-if="can('load_planning.write')" size="xs" color="neutral" variant="soft" block icon="i-lucide-plus" @click="openAdd(l)">Tambah barang</UButton>
          </div>
        </div>
      </div>
    </template>

    <UModal v-model:open="open" :title="activeLuggage ? `Tambah ke ${activeLuggage.label}` : 'Tambah barang'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Barang (siap di gudang)" required>
            <USelect v-model="form.order_item_id" :items="packableOptions" class="w-full" placeholder="Pilih barang…" />
          </UFormField>
          <p v-if="!packableOptions.length" class="text-xs text-stone-400">
            Tidak ada barang in_warehouse untuk route ini.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.order_item_id" @click="submit">Tambah</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
