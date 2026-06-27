<script setup lang="ts">
import type { Database } from '~/types/database.types'
import draggable from 'vuedraggable'

// Workspace scoped to ONE route (B2). Quantity-aware (B5): an item's units split
// across luggages — drag moves all remaining; the −/+ stepper rebalances. Status
// goes 'packed' only when every unit is placed (DB trigger).
const props = defineProps<{ tripId: string; routeId: string | null }>()
const tripId = toRef(props, 'tripId')

type OrderItemEmbed = {
  id: string
  qty: number
  item_name: string | null
  weight_g: number | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  products?: { name: string } | null
  orders?: { code: string | null; customers?: { name: string } | null } | null
}
type LoadItem = { id: string; qty: number; trip_route_id: string; order_items?: OrderItemEmbed | null }
type Luggage = Database['public']['Tables']['luggages']['Row'] & {
  luggage_types?: { name: string; max_weight_g: number | null; tare_weight_g: number | null } | null
  assigned?: { full_name: string | null } | null
  load_items?: LoadItem[]
}
type Packable = {
  id: string
  item_name: string | null
  qty: number
  weight_g: number | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  products?: { name: string } | null
  orders?: { code: string | null; trip_route_id: string; customers?: { name: string } | null } | null
}
type Card = { key: string; orderItemId: string; loadItemId: string | null; title: string; sub: string; meta: string; qty: number }
type DragChange = { added?: { element: Card }; removed?: { element: Card } }

const { can } = useCan()
const { items: luggages, addLoadItem, removeLoadItem, setLoadItemQty } = useLuggages(tripId)
const { items: packable } = usePackableItems(tripId)
const user = useSupabaseUser()
const toast = useToast()
const busy = ref(false) // serialize qty mutations so rapid −/+ clicks don't race

const routePackable = computed(() =>
  (packable.value as Packable[] ?? []).filter((p) => p.orders?.trip_route_id === props.routeId),
)
function routeItems(l: Luggage): LoadItem[] {
  return (l.load_items ?? []).filter((li) => li.trip_route_id === props.routeId)
}

// units of an order_item already placed on this route (across all luggages)
function placedOf(orderItemId: string) {
  let n = 0
  for (const l of (luggages.value as Luggage[]) ?? []) for (const li of routeItems(l)) if (li.order_items?.id === orderItemId) n += li.qty
  return n
}
function remainingOf(orderItemId: string) {
  const p = routePackable.value.find((x) => x.id === orderItemId)
  return p ? p.qty - placedOf(orderItemId) : 0
}

function weightOf(l: Luggage) {
  const loaded = routeItems(l).reduce((s, li) => s + Number(li.order_items?.weight_g ?? 0) * li.qty, 0)
  const tare = Number(l.luggage_types?.tare_weight_g ?? 0)
  const max = Number(l.luggage_types?.max_weight_g ?? 0)
  const total = loaded + tare
  return { total, max, over: max > 0 && total > max, pct: max > 0 ? Math.min(100, (total / max) * 100) : 0 }
}

const titleOf = (oi: { products?: { name: string } | null; item_name: string | null }) =>
  oi.products?.name ?? oi.item_name ?? '(item)'
// weight (perUnit × qty), per-unit dims (mm), total volume (cm³)
function metaStr(perUnitG: number, l: number | null, w: number | null, h: number | null, qty: number) {
  const parts = [`${Math.round(perUnitG * qty).toLocaleString('id-ID')} g`]
  if (l && w && h) {
    parts.push(`${l}×${w}×${h} mm`)
    parts.push(`${Math.round((Number(l) * Number(w) * Number(h) / 1000) * qty).toLocaleString('id-ID')} cm³`)
  }
  return parts.join(' · ')
}

const pool = ref<Card[]>([])
const byLuggage = reactive<Record<string, Card[]>>({})
watchEffect(() => {
  pool.value = routePackable.value
    .map((p) => ({ p, rem: p.qty - placedOf(p.id) }))
    .filter((x) => x.rem > 0)
    .map(({ p, rem }) => ({
      key: `p-${p.id}`,
      orderItemId: p.id,
      loadItemId: null,
      qty: rem,
      title: titleOf(p),
      sub: `${p.orders?.code ?? ''} · ${p.orders?.customers?.name ?? ''}`,
      meta: metaStr(Number(p.weight_g ?? 0), p.length_mm, p.width_mm, p.height_mm, rem),
    }))
  for (const l of (luggages.value as Luggage[]) ?? []) {
    byLuggage[l.id] = routeItems(l).map((li) => {
      const oi = li.order_items
      return {
        key: `li-${li.id}`,
        orderItemId: oi?.id ?? '',
        loadItemId: li.id,
        qty: li.qty,
        title: oi ? titleOf(oi) : '(item)',
        sub: `${oi?.orders?.code ?? ''} · ${oi?.orders?.customers?.name ?? ''}`,
        meta: metaStr(Number(oi?.weight_g ?? 0), oi?.length_mm ?? null, oi?.width_mm ?? null, oi?.height_mm ?? null, li.qty),
      }
    })
  }
})

const dragEnabled = computed(() => can('load_planning.write') && !!props.routeId)

// Group luggages by traveler so a board with 16+ bags stays navigable.
// Unassigned bags go last.
const luggageGroups = computed(() => {
  const groups = new Map<string, { key: string; travelerName: string; luggages: Luggage[] }>()
  for (const l of (luggages.value as Luggage[]) ?? []) {
    const key = l.assigned_traveler ?? '__none__'
    if (!groups.has(key)) groups.set(key, { key, travelerName: l.assigned?.full_name ?? 'Belum di-assign', luggages: [] })
    groups.get(key)!.luggages.push(l)
  }
  return [...groups.values()].sort((a, b) => (a.key === '__none__' ? 1 : b.key === '__none__' ? -1 : a.travelerName.localeCompare(b.travelerName)))
})

function existingInLuggage(luggageId: string, orderItemId: string): LoadItem | undefined {
  const l = ((luggages.value as Luggage[]) ?? []).find((x) => x.id === luggageId)
  return l ? routeItems(l).find((li) => li.order_items?.id === orderItemId) : undefined
}
async function place(destLuggageId: string, card: Card) {
  const dest = existingInLuggage(destLuggageId, card.orderItemId)
  if (dest && dest.id !== card.loadItemId) await setLoadItemQty(dest.id, dest.qty + card.qty)
  else if (!dest) await addLoadItem({ luggage_id: destLuggageId, order_item_id: card.orderItemId, trip_route_id: props.routeId!, qty: card.qty, placed_by: user.value?.id ?? null })
  if (card.loadItemId) await removeLoadItem(card.loadItemId) // moved from another luggage
}
async function onLuggageChange(luggageId: string, e: DragChange) {
  if (!e.added) return
  try { await place(luggageId, e.added.element) } catch (err) { toast.add({ title: 'Gagal memindah', description: (err as Error).message, color: 'error' }) }
}
async function onPoolChange(e: DragChange) {
  if (!e.added?.element.loadItemId) return
  try { await removeLoadItem(e.added.element.loadItemId) } catch (err) { toast.add({ title: 'Gagal mengeluarkan', description: (err as Error).message, color: 'error' }) }
}
async function inc(card: Card) {
  if (busy.value || !card.loadItemId || remainingOf(card.orderItemId) <= 0) return
  busy.value = true
  try { await setLoadItemQty(card.loadItemId, card.qty + 1) } catch (e) { toast.add({ title: 'Gagal', description: (e as Error).message, color: 'error' }) } finally { busy.value = false }
}
async function dec(card: Card) {
  if (busy.value || !card.loadItemId) return
  busy.value = true
  try {
    if (card.qty > 1) await setLoadItemQty(card.loadItemId, card.qty - 1)
    else await removeLoadItem(card.loadItemId)
  } catch (e) { toast.add({ title: 'Gagal', description: (e as Error).message, color: 'error' }) } finally { busy.value = false }
}
async function unpack(loadItemId: string) {
  if (busy.value) return
  busy.value = true
  try { await removeLoadItem(loadItemId) } catch (e) { toast.add({ title: 'Gagal mengeluarkan', description: (e as Error).message, color: 'error' }) } finally { busy.value = false }
}

// --- tap fallback: pick a queue item → place all its remaining units ---
const open = ref(false)
const saving = ref(false)
const activeLuggage = ref<Luggage | null>(null)
const form = reactive({ order_item_id: '' })
const packableOptions = computed(() => pool.value.map((c) => ({ label: `${c.title} (sisa ${c.qty})`, value: c.orderItemId })))
function openAdd(l: Luggage) {
  activeLuggage.value = l
  form.order_item_id = ''
  open.value = true
}
async function submit() {
  const card = pool.value.find((c) => c.orderItemId === form.order_item_id)
  if (!activeLuggage.value || !props.routeId || !card) return
  saving.value = true
  try { await place(activeLuggage.value.id, card); open.value = false } catch (e) { toast.add({ title: 'Gagal menambah', description: (e as Error).message, color: 'error' }) } finally { saving.value = false }
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="!routeId" class="text-sm text-stone-400 text-center py-16 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
      Pilih <span class="font-medium">route</span> dulu untuk mulai packing leg ini.
    </p>

    <template v-else>
      <p class="text-xs text-stone-500">
        {{ pool.length }} barang siap dimuat di route ini. Seret kartu ke luggage (pindah semua), atur jumlah dengan −/+.
      </p>

      <div class="flex gap-4 items-start">
        <!-- queue: sticky so it stays reachable while scrolling many luggages -->
        <div class="lp-queue w-60 shrink-0 sticky top-4 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40">
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
                <p class="truncate">{{ element.title }} <span class="text-stone-400">×{{ element.qty }}</span></p>
                <p class="text-xs text-stone-400 truncate">{{ element.sub }}</p>
                <p class="text-xs text-stone-500 tabular-nums">{{ element.meta }}</p>
              </div>
            </template>
          </draggable>
          <p v-if="!pool.length" class="text-xs text-stone-300 dark:text-stone-700 text-center pb-3">kosong</p>
        </div>

        <!-- luggages grouped by traveler, wrapping grid -->
        <div class="flex-1 min-w-0">
          <div v-if="!(luggages?.length)" class="text-sm text-stone-400 text-center py-10 px-6 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
            Belum ada luggage. Buat dulu di tab <span class="font-medium">Luggage</span>.
          </div>
          <div v-else class="space-y-5">
            <div v-for="g in luggageGroups" :key="g.key">
              <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <UIcon name="i-lucide-user" class="size-3.5" /> {{ g.travelerName }}
                <span class="font-normal text-stone-400 normal-case">· {{ g.luggages.length }} luggage</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <div v-for="l in g.luggages" :key="l.id" class="lp-luggage rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div class="p-3 border-b border-stone-100 dark:border-stone-800 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium text-sm">{{ l.label }}</p>
              <UBadge :color="luggageStatusColor(l.status)" variant="soft" size="xs" class="capitalize">{{ l.status }}</UBadge>
            </div>
            <p class="text-xs text-stone-400">{{ l.luggage_types?.name }}</p>
            <div>
              <div class="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="weightOf(l).over ? 'bg-error' : 'bg-primary'" :style="{ width: `${weightOf(l).pct}%` }" />
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
            :filter="'button'"
            :prevent-on-filter="false"
            class="p-2 space-y-1 min-h-[48px]"
            ghost-class="opacity-40"
            @change="(e: DragChange) => onLuggageChange(l.id, e)"
          >
            <template #item="{ element }">
              <div class="flex items-center justify-between gap-2 rounded-md border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing">
                <div class="min-w-0">
                  <p class="truncate">{{ element.title }}</p>
                  <p class="text-xs text-stone-400 truncate">{{ element.sub }}</p>
                  <p class="text-xs text-stone-500 tabular-nums">{{ element.meta }}</p>
                </div>
                <div v-if="can('load_planning.write')" class="flex items-center gap-0.5 shrink-0">
                  <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-minus" aria-label="Kurangi" :disabled="busy" @click.stop="dec(element)" />
                  <span class="text-xs tabular-nums w-5 text-center font-medium">{{ element.qty }}</span>
                  <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-plus" aria-label="Tambah" :disabled="busy || remainingOf(element.orderItemId) <= 0" @click.stop="inc(element)" />
                  <UButton size="xs" color="error" variant="ghost" icon="i-lucide-x" aria-label="Keluarkan" :disabled="busy" @click.stop="unpack(element.loadItemId)" />
                </div>
              </div>
            </template>
          </draggable>
          <div class="p-2 pt-0">
            <p v-if="!(byLuggage[l.id]?.length)" class="text-xs text-stone-300 dark:text-stone-700 text-center py-2">tarik barang ke sini</p>
            <UButton v-if="can('load_planning.write')" size="xs" color="neutral" variant="soft" block icon="i-lucide-plus" @click="openAdd(l)">Tambah barang</UButton>
          </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <UModal v-model:open="open" :title="activeLuggage ? `Tambah ke ${activeLuggage.label}` : 'Tambah barang'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Barang (siap di gudang)" required help="Semua sisa unit-nya dimasukkan; atur jumlah pakai −/+ di kartu.">
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
