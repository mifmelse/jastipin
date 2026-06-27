<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['invoices']['Row'] & {
  orders?: { code: string | null; customers?: { name: string } | null } | null
}

const { can } = useCan()
const { items, remove } = useInvoices()
const toast = useToast()
const router = useRouter()

const statusColor = (s: string) => (s === 'paid' ? 'success' : s === 'void' ? 'neutral' : s === 'sent' ? 'info' : 'warning')
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')

async function onDelete(row: Row) {
  if (!(await useConfirm().confirm({ title: 'Hapus invoice', description: `Hapus "${row.code}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Invoices" subtitle="Tagihan ke customer per order. Klik untuk lihat & cetak/PDF." icon="i-lucide-file-text" />

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-200/70 dark:bg-stone-800/50 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Invoice</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Order</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Customer</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Terbit</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr
            v-for="row in (items as Row[]) ?? []"
            :key="row.id"
            class="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
            @click="router.push(`/finance/invoices/${row.id}`)"
          >
            <td class="px-3 py-2 font-mono text-xs">{{ row.code }}</td>
            <td class="px-3 py-2 font-mono text-xs text-stone-500">{{ row.orders?.code }}</td>
            <td class="px-3 py-2">{{ row.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ fmtDate(row.issued_at) }}</td>
            <td class="px-3 py-2">
              <UBadge :color="statusColor(row.status)" variant="soft" class="capitalize">{{ row.status }}</UBadge>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton v-if="can('invoices.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada invoice. Terbitkan dari halaman Order.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <button
        v-for="row in (items as Row[]) ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
        @click="router.push(`/finance/invoices/${row.id}`)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-xs">{{ row.code }}</span>
          <UBadge :color="statusColor(row.status)" variant="soft" class="capitalize shrink-0">{{ row.status }}</UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.orders?.customers?.name ?? '—' }} · {{ row.orders?.code }}</span>
          <span class="text-xs text-stone-400 shrink-0">{{ fmtDate(row.issued_at) }}</span>
        </div>
      </button>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Belum ada invoice.</p>
    </div>
  </div>
</template>
