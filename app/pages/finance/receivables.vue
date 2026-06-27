<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Ar = {
  order_id: string
  code: string | null
  customer_name: string
  total_idr: number
  paid_idr: number
  outstanding_idr: number
  order_status: string
}
type Payment = Database['public']['Tables']['payments']['Row']

const { items, paymentsFor, recordPayment, removePayment } = useReceivables()
const { items: currencies } = useCurrencies()
const user = useSupabaseUser()
const toast = useToast()

const currencyOptions = computed(() => (currencies.value ?? []).map((c) => ({ label: c.code, value: c.code })))

const open = ref(false)
const saving = ref(false)
const active = ref<Ar | null>(null)
const history = ref<Payment[]>([])
const form = reactive({
  amount: '' as number | '',
  currency: 'IDR',
  fx_rate: 1 as number | '',
  method: '',
  reference: '',
  paid_at: '',
  status: 'paid',
})
const isForeign = computed(() => form.currency !== 'IDR')
watch(() => form.currency, (c) => {
  if (c === 'IDR') form.fx_rate = 1
})

async function openRow(r: Ar) {
  active.value = r
  Object.assign(form, {
    amount: r.outstanding_idr > 0 ? r.outstanding_idr : '',
    currency: 'IDR', fx_rate: 1, method: '', reference: '',
    paid_at: new Date().toISOString().slice(0, 10), status: 'paid',
  })
  open.value = true
  history.value = await paymentsFor(r.order_id)
}

async function save() {
  if (!active.value || form.amount === '') return
  saving.value = true
  try {
    await recordPayment({
      order_id: active.value.order_id,
      amount: Number(form.amount),
      currency: form.currency,
      fx_rate: form.currency === 'IDR' ? 1 : Number(form.fx_rate) || 1,
      method: form.method.trim() || null,
      reference: form.reference.trim() || null,
      paid_at: form.paid_at || null,
      status: form.status,
      recorded_by: user.value?.id ?? null,
    })
    history.value = await paymentsFor(active.value.order_id)
    Object.assign(form, { amount: '', method: '', reference: '' })
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function delPayment(id: string) {
  if (!active.value) return
  try {
    await removePayment(id)
    history.value = await paymentsFor(active.value.order_id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Receivables</h1>
      <p class="text-sm text-stone-500">Uang masuk dari customer per order — tagihan vs terbayar.</p>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Order</th>
            <th class="px-3 py-2 font-medium">Customer</th>
            <th class="px-3 py-2 font-medium text-right">Tagihan</th>
            <th class="px-3 py-2 font-medium text-right">Terbayar</th>
            <th class="px-3 py-2 font-medium text-right">Sisa</th>
            <th class="px-3 py-2 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="r in (items as Ar[]) ?? []" :key="r.order_id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ r.code }}</td>
            <td class="px-3 py-2">{{ r.customer_name }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ formatIDR(r.total_idr) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-success">{{ formatIDR(r.paid_idr) }}</td>
            <td class="px-3 py-2 text-right tabular-nums" :class="r.outstanding_idr > 0 ? 'text-warning font-medium' : 'text-stone-400'">
              {{ formatIDR(r.outstanding_idr) }}
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" :color="r.outstanding_idr > 0 ? 'primary' : 'neutral'" variant="soft" icon="i-lucide-wallet" @click="openRow(r)">
                  {{ r.outstanding_idr > 0 ? 'Catat bayar' : 'Riwayat' }}
                </UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada order.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="active ? `Pembayaran — ${active.code}` : 'Pembayaran'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <div class="flex justify-between text-sm">
            <span class="text-stone-500">{{ active.customer_name }}</span>
            <span>Sisa: <span class="font-semibold">{{ formatIDR(active.outstanding_idr) }}</span></span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Jumlah">
              <UInput v-model.number="form.amount" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Metode">
              <UInput v-model="form.method" class="w-full" placeholder="transfer / cash / QRIS" />
            </UFormField>
            <UFormField label="Currency">
              <USelect v-model="form.currency" :items="currencyOptions" class="w-full" />
            </UFormField>
            <UFormField v-if="isForeign" label="Kurs → IDR">
              <UInput v-model.number="form.fx_rate" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Tgl bayar">
              <UInput v-model="form.paid_at" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="form.status" :items="PAYMENT_STATUS_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Referensi" class="sm:col-span-2">
              <UInput v-model="form.reference" class="w-full" placeholder="no. transaksi (opsional)" />
            </UFormField>
          </div>
          <UButton :loading="saving" :disabled="form.amount === ''" icon="i-lucide-plus" @click="save">Catat pembayaran</UButton>

          <div v-if="history.length" class="space-y-1 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p class="text-xs font-medium text-stone-500 uppercase tracking-wide">Riwayat</p>
            <div v-for="p in history" :key="p.id" class="flex items-center justify-between gap-2 text-sm">
              <div>
                <UBadge :color="paymentStatusColor(p.status)" variant="soft" size="xs" class="mr-2 capitalize">{{ p.status }}</UBadge>
                {{ p.currency }} {{ Number(p.amount).toLocaleString('id-ID') }}
                <span class="text-xs text-stone-400">· {{ p.method ?? '—' }} · {{ fmtDate(p.paid_at) }}</span>
              </div>
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus" @click="delPayment(p.id)" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Tutup</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
