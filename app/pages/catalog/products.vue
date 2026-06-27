<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['products']['Row']

const { can } = useCan()
const { items, create, update, remove } = useProducts()
const { items: brands } = useBrands()
const { items: categories } = useCategories()
const { items: subCategories } = useSubCategories()
const { items: units } = useUnits()
const { items: countries } = useCountries()
const { items: currencies } = useCurrencies()
const toast = useToast()

const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

const NONE_OPT = { label: '— none —', value: NONE }
const brandOptions = computed(() => [NONE_OPT, ...(brands.value ?? []).map((b) => ({ label: b.name, value: b.id }))])
const categoryOptions = computed(() => (categories.value ?? []).map((c) => ({ label: c.name, value: c.id })))
const unitOptions = computed(() => (units.value ?? []).map((u) => ({ label: u.name, value: u.id })))
const countryOptions = computed(() => [NONE_OPT, ...(countries.value ?? []).map((c) => ({ label: c.name, value: c.id }))])
// Category-dependent rendering keys off this DEFERRED value, not form.category_id
// directly — so picking a category doesn't re-render the sub-category select in
// the same flush as the category dropdown's close (which would keep it open).
const effectiveCategory = ref('')
const subOptions = computed(() => [
  NONE_OPT,
  ...(subCategories.value ?? [])
    .filter((s) => s.category_id === effectiveCategory.value)
    .map((s) => ({ label: s.name, value: s.id })),
])

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  name: '',
  category_id: '',
  unit_id: '',
  brand_id: NONE,
  sub_category_id: NONE,
  country_id: NONE,
  weight_g: '' as number | '',
  length_mm: '' as number | '',
  width_mm: '' as number | '',
  height_mm: '' as number | '',
  base_price: '' as number | '',
  cost_price: '' as number | '',
  currency: 'IDR',
  description: '',
  is_active: true,
})

const numOrNull = (v: number | '') => (v === '' ? null : Number(v))

// Clear sub-category if it no longer belongs to the chosen category.
// Deferred to nextTick: mutating form state synchronously inside the select's
// change handler interrupts the dropdown's close animation (it stays open).
watch(
  () => form.category_id,
  () => {
    nextTick(() => {
      effectiveCategory.value = form.category_id
      const ok = (subCategories.value ?? []).some(
        (s) => s.id === form.sub_category_id && s.category_id === form.category_id,
      )
      if (!ok) form.sub_category_id = NONE
    })
  },
)

function reset() {
  Object.assign(form, {
    name: '', category_id: '', unit_id: '', brand_id: NONE, sub_category_id: NONE,
    country_id: NONE, weight_g: '', length_mm: '', width_mm: '', height_mm: '',
    base_price: '', cost_price: '', currency: 'IDR', description: '', is_active: true,
  })
  effectiveCategory.value = ''
}
function openCreate() {
  editing.value = null
  reset()
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    category_id: row.category_id,
    unit_id: row.unit_id,
    brand_id: fromNullable(row.brand_id),
    sub_category_id: fromNullable(row.sub_category_id),
    country_id: fromNullable(row.country_id),
    weight_g: row.weight_g,
    length_mm: row.length_mm ?? '',
    width_mm: row.width_mm ?? '',
    height_mm: row.height_mm ?? '',
    base_price: row.base_price ?? '',
    cost_price: row.cost_price ?? '',
    currency: row.currency,
    description: row.description ?? '',
    is_active: row.is_active,
  })
  effectiveCategory.value = row.category_id
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      unit_id: form.unit_id,
      brand_id: toNullable(form.brand_id),
      sub_category_id: toNullable(form.sub_category_id),
      country_id: toNullable(form.country_id),
      weight_g: Number(form.weight_g) || 0,
      length_mm: numOrNull(form.length_mm),
      width_mm: numOrNull(form.width_mm),
      height_mm: numOrNull(form.height_mm),
      base_price: numOrNull(form.base_price),
      cost_price: numOrNull(form.cost_price),
      currency: form.currency.trim() || 'IDR',
      description: form.description.trim() || null,
      is_active: form.is_active,
    }
    if (editing.value) await update(editing.value.id, payload)
    else await create(payload)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: Row) {
  if (!(await useConfirm().confirm({ title: 'Hapus product', description: `Hapus "${row.name}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const valid = computed(
  () => form.name.trim() && form.category_id && form.unit_id && Number(form.weight_g) > 0,
)
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Products" subtitle="Katalog produk. Berat (gram) wajib untuk packing." icon="i-lucide-package">
      <template #actions>
        <UButton v-if="can('products.write')" icon="i-lucide-plus" :disabled="!(categories?.length) || !(units?.length)" @click="openCreate">
          Tambah
        </UButton>
      </template>
    </PageHeader>

    <p v-if="!(categories?.length) || !(units?.length)" class="text-sm text-amber-600">
      Butuh minimal 1 Category & 1 Unit dulu sebelum bikin product.
    </p>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Brand</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Category</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Unit</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Weight (g)</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Price</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2">
              <div class="font-medium">{{ row.name }}</div>
              <div v-if="row.code" class="font-mono text-xs text-stone-400">{{ row.code }}</div>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ row.brands?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">
              {{ row.categories?.name }}<span v-if="row.sub_categories?.name"> / {{ row.sub_categories.name }}</span>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ row.units?.symbol ?? row.units?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.weight_g }}</td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold text-primary">
              {{ row.base_price != null ? `${row.currency} ${Number(row.base_price).toLocaleString('id-ID')}` : '—' }}
            </td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">
                {{ row.is_active ? 'Yes' : 'No' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('products.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('products.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="8" class="px-3 py-6 text-center text-stone-400">Belum ada produk.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mobile: cards instead of a cramped table -->
    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ row.name }}</span>
            <span v-if="row.code" class="font-mono text-xs text-stone-400 shrink-0">{{ row.code }}</span>
          </div>
          <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft" class="shrink-0">
            {{ row.is_active ? 'Yes' : 'No' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">
            {{ row.categories?.name }}<span v-if="row.sub_categories?.name"> / {{ row.sub_categories.name }}</span>
          </span>
          <span class="font-semibold text-primary tabular-nums shrink-0">
            {{ row.base_price != null ? `${row.currency} ${Number(row.base_price).toLocaleString('id-ID')}` : '—' }}
          </span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada produk.</p>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Product' : 'Tambah Product'" :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <div class="space-y-4">
          <UFormField v-if="editing" label="Code" help="Otomatis dari sistem">
            <UInput :model-value="editing.code ?? ''" disabled class="w-full font-mono" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Name" required>
              <UInput v-model="form.name" class="w-full" />
            </UFormField>
            <UFormField label="Category" required>
              <USelect v-model="form.category_id" :items="categoryOptions" class="w-full" placeholder="Pilih…" />
            </UFormField>
            <UFormField label="Sub-category">
              <USelect v-model="form.sub_category_id" :items="subOptions" class="w-full" :disabled="!effectiveCategory" />
            </UFormField>
            <UFormField label="Brand">
              <USelect v-model="form.brand_id" :items="brandOptions" class="w-full" />
            </UFormField>
            <UFormField label="Unit" required>
              <USelect v-model="form.unit_id" :items="unitOptions" class="w-full" placeholder="Pilih…" />
            </UFormField>
            <UFormField label="Origin country">
              <USelect v-model="form.country_id" :items="countryOptions" class="w-full" />
            </UFormField>
            <UFormField label="Weight (g)" required>
              <UInput v-model.number="form.weight_g" type="number" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UFormField label="Length (mm)">
              <UInput v-model.number="form.length_mm" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Width (mm)">
              <UInput v-model.number="form.width_mm" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Height (mm)">
              <UInput v-model.number="form.height_mm" type="number" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UFormField label="Base price">
              <UInput v-model.number="form.base_price" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Cost price">
              <UInput v-model.number="form.cost_price" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Currency">
              <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="2" />
          </UFormField>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!valid" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
