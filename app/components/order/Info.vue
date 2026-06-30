<script setup lang="ts">
import type { Database } from '~/types/database.types'

type OrderDetail = Database['public']['Views']['order_summaries']['Row'] & {
  customers?: { name: string; phone: string | null } | null
  trip_route?: {
    id: string
    to_country?: { id: string; name: string; iso2: string | null } | null
  } | null
}

const props = defineProps<{ order: OrderDetail }>()
const emit = defineEmits<{ saved: [] }>()

const { update } = useOrder(props.order.id)
const { items: addresses } = useCustomerAddresses(props.order.customer_id)
const { items: currencies } = useCurrencies()
const toast = useToast()

const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

// Addresses are filtered to the leg's destination country (docs: "alamat
// difilter sesuai negara tujuan leg"); country-less addresses always show.
const destCountryId = computed(() => props.order.trip_route?.to_country?.id ?? null)
const addressOptions = computed(() => [
  { label: '— tanpa alamat —', value: NONE },
  ...(addresses.value ?? [])
    .filter((a) => !destCountryId.value || a.country_id === destCountryId.value || a.country_id === null)
    .map((a) => ({
      label: [a.label, a.recipient_name, a.city].filter(Boolean).join(' · ') || 'Alamat',
      value: a.id,
    })),
])

const form = reactive({
  status: props.order.status,
  shipping_address_id: fromNullable(props.order.shipping_address_id),
  fee: (props.order.fee ?? 0) as number | '',
  shipping_cost: (props.order.shipping_cost ?? 0) as number | '',
  currency: props.order.currency,
  fx_rate: (props.order.fx_rate ?? 1) as number | '',
  notes: props.order.notes ?? '',
})
const isForeign = computed(() => form.currency !== 'IDR')
watch(() => form.currency, (c) => {
  if (c === 'IDR') form.fx_rate = 1
})

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await update({
      status: form.status,
      shipping_address_id: toNullable(form.shipping_address_id),
      fee: form.fee === '' ? 0 : Number(form.fee),
      shipping_cost: form.shipping_cost === '' ? 0 : Number(form.shipping_cost),
      currency: form.currency,
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      notes: form.notes.trim() || null,
    })
    toast.add({ title: 'Tersimpan', color: 'success' })
    emit('saved')
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const fmt = (n: number | null) => `${form.currency} ${Number(n ?? 0).toLocaleString('id-ID')}`
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-2 lg:gap-12">
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField label="Status">
          <USelect v-model="form.status" :items="ORDER_STATUS_OPTIONS" class="w-full" />
        </UFormField>
        <UFormField label="Alamat penerima">
          <USelect v-model="form.shipping_address_id" :items="addressOptions" class="w-full" />
        </UFormField>
        <UFormField label="Currency">
          <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
        </UFormField>
        <UFormField v-if="isForeign" label="Kurs → IDR" help="1 unit = ? IDR">
          <UInput v-model.number="form.fx_rate" type="number" class="w-full" />
        </UFormField>
        <UFormField label="Fee">
          <UInput v-model.number="form.fee" type="number" class="w-full" />
        </UFormField>
        <UFormField label="Shipping cost">
          <UInput v-model.number="form.shipping_cost" type="number" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Notes">
        <UTextarea v-model="form.notes" :rows="2" class="w-full" />
      </UFormField>
      <UButton :loading="saving" @click="save">Simpan</UButton>
    </div>

    <div class="space-y-2">
      <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Ringkasan</h2>
      <dl class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800 text-sm">
        <div class="flex justify-between px-3 py-2">
          <dt class="text-stone-500">Subtotal ({{ order.item_count }} item)</dt>
          <dd class="tabular-nums">{{ fmt(order.subtotal) }}</dd>
        </div>
        <div class="flex justify-between px-3 py-2">
          <dt class="text-stone-500">Fee</dt>
          <dd class="tabular-nums">{{ fmt(order.fee) }}</dd>
        </div>
        <div class="flex justify-between px-3 py-2">
          <dt class="text-stone-500">Shipping</dt>
          <dd class="tabular-nums">{{ fmt(order.shipping_cost) }}</dd>
        </div>
        <div class="flex justify-between px-3 py-2 font-semibold">
          <dt>Total</dt>
          <dd class="tabular-nums">{{ fmt(order.total) }}</dd>
        </div>
        <div v-if="order.currency !== 'IDR'" class="flex justify-between px-3 py-2 text-stone-500">
          <dt>Total (IDR @ {{ order.fx_rate }})</dt>
          <dd class="tabular-nums">{{ formatIDR(order.total_idr) }}</dd>
        </div>
      </dl>
      <p class="text-xs text-stone-400">Subtotal & total dihitung otomatis dari item (tidak disimpan).</p>
    </div>
  </div>
</template>
