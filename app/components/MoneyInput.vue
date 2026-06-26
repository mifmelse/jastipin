<script setup lang="ts">
// Amount + currency + fx_rate (to IDR), with an IDR preview for foreign money.
// Reused by trip bookings/expenses and (later) order/finance.
const amount = defineModel<number | ''>('amount', { required: true })
const currency = defineModel<string>('currency', { required: true })
const fxRate = defineModel<number | ''>('fxRate', { required: true })

const { items: currencies } = useCurrencies()
const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

const isForeign = computed(() => currency.value !== 'IDR')
watch(currency, (c) => {
  if (c === 'IDR') fxRate.value = 1
})

const idr = computed(() =>
  amount.value === '' ? null : Math.round(Number(amount.value) * Number(fxRate.value || 1)),
)
</script>

<template>
  <div class="space-y-2">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <UFormField label="Amount">
        <UInput v-model.number="amount" type="number" class="w-full" />
      </UFormField>
      <UFormField label="Currency">
        <USelect v-model="currency" :items="currencyOptions" class="w-full" />
      </UFormField>
      <UFormField v-if="isForeign" label="Kurs → IDR" help="1 unit = ? IDR">
        <UInput v-model.number="fxRate" type="number" class="w-full" />
      </UFormField>
    </div>
    <p v-if="isForeign && idr !== null" class="text-xs text-stone-500">
      ≈ Rp {{ idr.toLocaleString('id-ID') }}
    </p>
  </div>
</template>
