<script setup lang="ts">
import type { Database } from '~/types/database.types'

type SourcingRec = { is_substitute: boolean; substitute_note: string | null }
type ItemRow = Database['public']['Tables']['order_items']['Row'] & {
  products?: { name: string; image_url: string | null; base_price: number | null; weight_g: number | null; length_mm: number | null; width_mm: number | null; height_mm: number | null } | null
  units?: { name: string; symbol: string | null } | null
  // unique FK → supabase may embed as an object or a single-element array
  sourcing_records?: SourcingRec | SourcingRec[] | null
}

const props = defineProps<{ orderId: string; currency: string }>()
const emit = defineEmits<{ changed: [] }>()

const { items, create, update, remove } = useOrderItems(props.orderId)
const { items: products } = useProducts()
const { items: units } = useUnits()
const toast = useToast()

const productOptions = computed(() => (products.value ?? []).map((p) => ({ label: p.name, value: p.id })))
// The picked product's catalog data — price auto-fills, weight/dims come from here.
const selectedProduct = computed(() => (products.value ?? []).find((p) => p.id === form.product_id) ?? null)
function pickProduct(id: string) {
  form.product_id = id
  const p = (products.value ?? []).find((x) => x.id === id)
  if (p) form.requested_price = p.base_price ?? '' // auto-fill (editable)
}
// surfaced from the sourcing step (substitution = barang diganti)
const substitutionOf = (i: ItemRow) => {
  const raw = i.sourcing_records
  const sr = Array.isArray(raw) ? raw[0] : raw
  return sr?.is_substitute ? sr : null
}
const unitOptions = computed(() => [
  { label: '— unit —', value: NONE },
  ...(units.value ?? []).map((u) => ({ label: u.symbol ? `${u.name} (${u.symbol})` : u.name, value: u.id })),
])

const itemLabel = (i: ItemRow) => i.products?.name ?? i.item_name ?? '(item)'
// product items show the catalog photo; free-text items their own upload
const itemPhoto = (i: ItemRow) => (i.product_id ? i.products?.image_url : i.image_url) ?? null
// drop-in = customer's own goods (no purchase cost) → no item price; revenue is the order-level fee
const priced = (i: ItemRow) => i.fulfillment_type === 'sourcing'
const lineTotal = (i: ItemRow) => i.qty * Number(i.requested_price ?? 0)

// Berat per-unit (free-text input, atau dari produk) × qty = total.
const perUnitWeight = computed(() =>
  mode.value === 'free' ? Number(form.weight_g || 0) : Number(selectedProduct.value?.weight_g ?? 0),
)
const weightTotal = computed(() => perUnitWeight.value * (Number(form.qty) || 1))

// --- add / edit ---
// An item is EITHER a catalog product OR a free-text drop-in — never both.
const open = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const mode = ref<'product' | 'free'>('product')
const form = reactive({
  product_id: '',
  item_name: '',
  fulfillment_type: 'sourcing',
  qty: 1 as number | '',
  unit_id: NONE,
  requested_price: '' as number | '',
  actual_price: '' as number | '',
  weight_g: '' as number | '',
  length_mm: '' as number | '',
  width_mm: '' as number | '',
  height_mm: '' as number | '',
  status: 'pending',
  notes: '',
  image_url: '',
})
const showDims = ref(false)

function reset() {
  Object.assign(form, {
    product_id: '', item_name: '', fulfillment_type: 'sourcing', qty: 1, unit_id: NONE,
    requested_price: '', actual_price: '', weight_g: '', length_mm: '', width_mm: '', height_mm: '',
    status: 'pending', notes: '', image_url: '',
  })
  showDims.value = false
}
function openCreate() {
  editingId.value = null
  mode.value = 'product'
  reset()
  open.value = true
}
function openEdit(i: ItemRow) {
  editingId.value = i.id
  mode.value = i.product_id ? 'product' : 'free'
  Object.assign(form, {
    product_id: i.product_id ?? '',
    item_name: i.item_name ?? '',
    fulfillment_type: i.fulfillment_type,
    qty: i.qty,
    unit_id: fromNullable(i.unit_id),
    requested_price: i.requested_price ?? '',
    actual_price: i.actual_price ?? '',
    weight_g: i.weight_g ?? '',
    length_mm: i.length_mm ?? '',
    width_mm: i.width_mm ?? '',
    height_mm: i.height_mm ?? '',
    status: i.status,
    notes: i.notes ?? '',
    image_url: i.image_url ?? '',
  })
  showDims.value = !!(i.length_mm || i.width_mm || i.height_mm)
  open.value = true
}
// Toggling mode (a USER action) clears the other mode's field so product/free
// never mix. NOT a watch(mode) — that would also fire when openEdit() sets the
// mode programmatically and wipe the prefilled value before it renders.
function setMode(m: 'product' | 'free') {
  if (m === mode.value) return
  mode.value = m
  form.product_id = ''
  form.item_name = ''
}

const canSave = computed(() => (mode.value === 'product' ? !!form.product_id : !!form.item_name.trim()))

const num = (v: number | '') => (v === '' ? null : Number(v))

async function save() {
  saving.value = true
  try {
    const payload = {
      order_id: props.orderId,
      product_id: mode.value === 'product' ? form.product_id || null : null,
      item_name: mode.value === 'free' ? form.item_name.trim() || null : null,
      fulfillment_type: form.fulfillment_type,
      qty: Number(form.qty) || 1,
      unit_id: toNullable(form.unit_id),
      requested_price: form.fulfillment_type === 'sourcing' ? num(form.requested_price) : null,
      actual_price: form.fulfillment_type === 'sourcing' ? num(form.actual_price) : null,
      // product items inherit weight/dims from the catalog — only free-text items carry their own
      weight_g: mode.value === 'free' ? num(form.weight_g) : null,
      length_mm: mode.value === 'free' ? num(form.length_mm) : null,
      width_mm: mode.value === 'free' ? num(form.width_mm) : null,
      height_mm: mode.value === 'free' ? num(form.height_mm) : null,
      status: form.status,
      notes: form.notes.trim() || null,
      // product items show the catalog photo — only free-text items carry their own
      image_url: mode.value === 'free' ? form.image_url || null : null,
    }
    if (editingId.value) await update(editingId.value, payload)
    else await create(payload)
    open.value = false
    emit('changed')
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function onDelete(i: ItemRow) {
  if (!(await useConfirm().confirm({ title: 'Hapus item', description: `Hapus "${itemLabel(i)}"?` }))) return
  try {
    await remove(i.id)
    emit('changed')
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const money = (n: number | null) => `${props.currency} ${Number(n ?? 0).toLocaleString('id-ID')}`
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah item</UButton>
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Item</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Fulfillment</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Qty</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Harga</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Subtotal</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="i in (items as ItemRow[]) ?? []" :key="i.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <MediaThumb :url="itemPhoto(i)" size="size-9" icon="i-lucide-box" />
                <div class="min-w-0">
                  <div class="font-medium flex items-center gap-1.5">
                    {{ itemLabel(i) }}
                    <UBadge v-if="substitutionOf(i)" color="warning" variant="soft" size="xs">diganti</UBadge>
                  </div>
                  <div v-if="!i.product_id" class="text-xs text-stone-400">titipan</div>
                  <div v-if="substitutionOf(i)?.substitute_note" class="text-xs text-warning truncate max-w-[18rem]">↳ {{ substitutionOf(i)?.substitute_note }}</div>
                </div>
              </div>
            </td>
            <td class="px-3 py-2">
              <UBadge :color="i.fulfillment_type === 'sourcing' ? 'info' : 'neutral'" variant="soft">
                {{ i.fulfillment_type === 'sourcing' ? 'Sourcing' : 'Drop-in' }}
              </UBadge>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">
              {{ i.qty }}<span v-if="i.units" class="text-stone-400"> {{ i.units.symbol ?? i.units.name }}</span>
            </td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ priced(i) ? money(i.requested_price) : '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums" :class="priced(i) ? 'font-semibold text-primary' : 'text-stone-400'">{{ priced(i) ? money(lineTotal(i)) : '—' }}</td>
            <td class="px-3 py-2">
              <UBadge :color="itemStatusColor(i.status)" variant="soft" class="capitalize">
                {{ i.status.replace('_', ' ') }}
              </UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end gap-1">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit item" @click="openEdit(i)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus item" @click="onDelete(i)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="7" class="px-3 py-6 text-center text-stone-400">Belum ada item.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="i in (items as ItemRow[]) ?? []"
        :key="i.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ itemLabel(i) }}</span>
            <UBadge v-if="substitutionOf(i)" color="warning" variant="soft" size="xs" class="shrink-0">diganti</UBadge>
            <span v-if="!i.product_id" class="font-mono text-xs text-stone-400 shrink-0">titipan</span>
          </div>
          <UBadge :color="itemStatusColor(i.status)" variant="soft" class="capitalize shrink-0">
            {{ i.status.replace('_', ' ') }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">
            {{ i.qty }}<span v-if="i.units"> {{ i.units.symbol ?? i.units.name }}</span><template v-if="priced(i)"> × {{ money(i.requested_price) }}</template><template v-else> · drop-in (tanpa biaya)</template>
          </span>
          <span v-if="priced(i)" class="font-semibold text-primary tabular-nums shrink-0">{{ money(lineTotal(i)) }}</span>
          <span v-else class="text-stone-400 tabular-nums shrink-0">—</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada item.</p>
    </div>

    <UModal v-model:open="open" :title="editingId ? 'Edit Item' : 'Tambah Item'">
      <template #body>
        <div class="space-y-4">
          <div class="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 text-sm">
            <button
              type="button"
              class="px-3 py-1 rounded-md transition-colors"
              :class="mode === 'product' ? 'bg-primary text-white' : 'text-stone-500'"
              @click="setMode('product')"
            >
              Produk katalog
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-md transition-colors"
              :class="mode === 'free' ? 'bg-primary text-white' : 'text-stone-500'"
              @click="setMode('free')"
            >
              Titipan (free-text)
            </button>
          </div>

          <UFormField v-if="mode === 'product'" label="Produk" required>
            <USelect :model-value="form.product_id" :items="productOptions" class="w-full" placeholder="Pilih produk…" @update:model-value="pickProduct" />
          </UFormField>
          <UFormField v-else label="Nama item" required>
            <UInput v-model="form.item_name" class="w-full" placeholder="mis. Skincare titipan" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Fulfillment">
              <USelect v-model="form.fulfillment_type" :items="FULFILLMENT_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="form.status" :items="ITEM_STATUS_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Qty">
              <UInput v-model.number="form.qty" type="number" min="1" class="w-full" />
            </UFormField>
            <UFormField label="Unit">
              <USelect v-model="form.unit_id" :items="unitOptions" class="w-full" />
            </UFormField>
            <UFormField v-if="form.fulfillment_type === 'sourcing'" :label="`Harga diminta (${currency})`" :help="mode === 'product' ? 'Auto dari produk (bisa diubah)' : undefined">
              <UInput v-model.number="form.requested_price" type="number" class="w-full" />
            </UFormField>
            <UFormField v-if="form.fulfillment_type === 'sourcing'" :label="`Harga aktual (${currency})`" help="Yang benar-benar dibayar shopper.">
              <UInput v-model.number="form.actual_price" type="number" class="w-full" />
            </UFormField>
            <UFormField v-if="mode === 'free'" label="Berat / unit (gram)" :help="`Total ${weightTotal.toLocaleString('id-ID')} g`">
              <UInput v-model.number="form.weight_g" type="number" class="w-full" />
            </UFormField>
            <UFormField v-else label="Berat / unit">
              <div class="h-9 flex items-center text-sm text-stone-500">
                <span v-if="selectedProduct?.weight_g != null">{{ Number(selectedProduct.weight_g).toLocaleString('id-ID') }} g · total {{ weightTotal.toLocaleString('id-ID') }} g</span>
                <span v-else class="text-stone-400">dari produk</span>
              </div>
            </UFormField>
          </div>

          <div v-if="mode === 'free'">
            <button type="button" class="text-xs text-primary hover:underline" @click="showDims = !showDims">
              {{ showDims ? '− Sembunyikan' : '+ Tambah' }} dimensi (mm)
            </button>
            <div v-if="showDims" class="grid grid-cols-3 gap-3 mt-2">
              <UFormField label="Panjang"><UInput v-model.number="form.length_mm" type="number" class="w-full" /></UFormField>
              <UFormField label="Lebar"><UInput v-model.number="form.width_mm" type="number" class="w-full" /></UFormField>
              <UFormField label="Tinggi"><UInput v-model.number="form.height_mm" type="number" class="w-full" /></UFormField>
            </div>
          </div>

          <UFormField label="Notes">
            <UInput v-model="form.notes" class="w-full" />
          </UFormField>
          <UFormField v-if="mode === 'free'" label="Foto item" help="Referensi biar shopper kenal barangnya.">
            <FileUpload v-model="form.image_url" folder="order-items" accept="image/*" />
          </UFormField>
          <UFormField v-else label="Foto item" help="Dari master produk.">
            <MediaThumb :url="selectedProduct?.image_url" size="size-16" icon="i-lucide-box" />
          </UFormField>
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
