<script setup lang="ts">
definePageMeta({ layout: 'print' })

const route = useRoute()
const id = route.params.id as string
const { data, status, updateStatus } = useInvoice(id)
const toast = useToast()

const inv = computed(() => data.value?.inv ?? null)
const order = computed(() => data.value?.order ?? null)
const company = computed(() => data.value?.company ?? null)
const customer = computed(() => data.value?.customer ?? null)
const address = computed(() => data.value?.address ?? null)
const items = computed(() => data.value?.items ?? [])

const cur = computed(() => order.value?.currency ?? 'IDR')
const fmt = (n: number | null) => `${cur.value} ${Number(n ?? 0).toLocaleString('id-ID')}`
const priced = (i: { fulfillment_type: string }) => i.fulfillment_type === 'sourcing'
const itemName = (i: { products?: { name: string } | null; item_name: string | null }) => i.products?.name ?? i.item_name ?? '(item)'
const lineTotal = (i: { qty: number; requested_price: number | null }) => i.qty * Number(i.requested_price ?? 0)
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')

const STATUS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Terkirim', value: 'sent' },
  { label: 'Lunas', value: 'paid' },
  { label: 'Void', value: 'void' },
]
async function onStatus(s: string) {
  try {
    await updateStatus(s)
  } catch (e) {
    toast.add({ title: 'Gagal', description: (e as Error).message, color: 'error' })
  }
}
function doPrint() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div>
    <!-- toolbar (hidden when printing) -->
    <div class="no-print max-w-3xl mx-auto px-4 mb-4 flex items-center gap-2">
      <UButton to="/finance/invoices" color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm">Invoices</UButton>
      <div class="ml-auto flex items-center gap-2">
        <USelect v-if="inv" :model-value="inv.status" :items="STATUS" size="sm" class="w-32" @update:model-value="onStatus" />
        <UButton icon="i-lucide-printer" size="sm" @click="doPrint">Cetak / Simpan PDF</UButton>
      </div>
    </div>

    <div v-if="status === 'pending'" class="text-center text-stone-400 text-sm py-10">Memuat…</div>
    <div v-else-if="!inv" class="text-center text-stone-400 text-sm py-10">Invoice tidak ditemukan.</div>

    <!-- the printable document -->
    <div v-else class="invoice-doc max-w-3xl mx-auto bg-white text-stone-900 rounded-lg shadow-sm print:shadow-none print:rounded-none p-8 sm:p-10">
      <!-- header -->
      <div class="flex items-start justify-between gap-6 border-b border-stone-200 pb-6">
        <div class="flex items-start gap-3">
          <img v-if="company?.logo_url" :src="company.logo_url" alt="" class="size-14 rounded-lg object-cover" />
          <div>
            <p class="text-lg font-semibold">{{ company?.name ?? 'Bagasian' }}</p>
            <p v-if="company?.address" class="text-xs text-stone-500 whitespace-pre-line max-w-xs">{{ company.address }}</p>
            <p v-if="company?.phone || company?.email" class="text-xs text-stone-500">
              {{ [company?.phone, company?.email].filter(Boolean).join(' · ') }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xl font-bold tracking-tight">INVOICE</p>
          <p class="font-mono text-sm">{{ inv.code }}</p>
          <UBadge :color="inv.status === 'paid' ? 'success' : inv.status === 'void' ? 'neutral' : 'warning'" variant="soft" class="mt-1 capitalize">{{ inv.status }}</UBadge>
        </div>
      </div>

      <!-- meta -->
      <div class="grid grid-cols-2 gap-6 py-6 text-sm">
        <div>
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Ditagihkan ke</p>
          <p class="font-medium">{{ customer?.name ?? '—' }}</p>
          <p v-if="customer?.phone" class="text-stone-500">{{ customer.phone }}</p>
          <p v-if="address" class="text-stone-500 whitespace-pre-line">{{ [address.recipient_name, address.address_line, address.city].filter(Boolean).join('\n') }}</p>
        </div>
        <div class="text-right space-y-0.5">
          <p><span class="text-stone-400">Order:</span> <span class="font-mono">{{ order?.code }}</span></p>
          <p><span class="text-stone-400">Terbit:</span> {{ fmtDate(inv.issued_at) }}</p>
          <p><span class="text-stone-400">Jatuh tempo:</span> {{ fmtDate(inv.due_at) }}</p>
        </div>
      </div>

      <!-- items -->
      <table class="w-full text-sm">
        <thead>
          <tr class="border-y border-stone-200 text-left text-stone-500">
            <th class="py-2 font-medium">Item</th>
            <th class="py-2 font-medium text-right w-16">Qty</th>
            <th class="py-2 font-medium text-right w-32">Harga</th>
            <th class="py-2 font-medium text-right w-32">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in items" :key="i.id" class="border-b border-stone-100">
            <td class="py-2">
              {{ itemName(i) }}
              <span v-if="!priced(i)" class="text-xs text-stone-400">(drop-in)</span>
            </td>
            <td class="py-2 text-right tabular-nums">{{ i.qty }}<span v-if="i.units" class="text-stone-400"> {{ i.units.symbol ?? i.units.name }}</span></td>
            <td class="py-2 text-right tabular-nums text-stone-500">{{ priced(i) ? fmt(i.requested_price) : '—' }}</td>
            <td class="py-2 text-right tabular-nums">{{ priced(i) ? fmt(lineTotal(i)) : '—' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- totals -->
      <div class="flex justify-end pt-4">
        <dl class="w-64 text-sm space-y-1">
          <div class="flex justify-between"><dt class="text-stone-500">Subtotal</dt><dd class="tabular-nums">{{ fmt(order?.subtotal ?? 0) }}</dd></div>
          <div class="flex justify-between"><dt class="text-stone-500">Fee</dt><dd class="tabular-nums">{{ fmt(order?.fee ?? 0) }}</dd></div>
          <div class="flex justify-between"><dt class="text-stone-500">Shipping</dt><dd class="tabular-nums">{{ fmt(order?.shipping_cost ?? 0) }}</dd></div>
          <div class="flex justify-between border-t border-stone-200 pt-1 font-semibold text-base"><dt>Total</dt><dd class="tabular-nums">{{ fmt(order?.total ?? 0) }}</dd></div>
          <div v-if="cur !== 'IDR'" class="flex justify-between text-stone-500"><dt>Total (IDR @ {{ order?.fx_rate }})</dt><dd class="tabular-nums">{{ formatIDR(order?.total_idr ?? 0) }}</dd></div>
        </dl>
      </div>

      <!-- payment + footer -->
      <div class="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-stone-200 text-sm">
        <div>
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Pembayaran</p>
          <p v-if="company?.bank_name || company?.bank_account">{{ company?.bank_name }} · {{ company?.bank_account }}</p>
          <p v-if="company?.bank_holder" class="text-stone-500">a.n. {{ company.bank_holder }}</p>
          <img v-if="company?.qris_url" :src="company.qris_url" alt="QRIS" class="size-28 object-contain mt-2" />
        </div>
        <div v-if="company?.invoice_note" class="text-xs text-stone-500 whitespace-pre-line">{{ company.invoice_note }}</div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  .no-print { display: none !important; }
  @page { margin: 12mm; }
}
</style>
