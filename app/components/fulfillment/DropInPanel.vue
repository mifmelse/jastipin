<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Intake = Database['public']['Tables']['drop_in_intakes']['Row']
type Row = {
  id: string
  qty: number
  item_name: string | null
  status: string
  products?: { name: string } | null
  orders?: { code: string | null; customers?: { name: string } | null } | null
  drop_in_intakes?: Intake | null
}

const filterLeg = ref(NONE)
const legId = computed(() => toNullable(filterLeg.value))
const { items, save } = useDropInQueue(legId)
const { items: legs } = useAllLegs()
const user = useSupabaseUser()
const toast = useToast()

const legOptions = computed(() => [
  { label: 'Semua leg', value: NONE },
  ...(legs.value ?? []).map((l) => ({ label: legLabel(l as LegEmbed), value: l.id })),
])
const itemLabel = (r: Row) => r.products?.name ?? r.item_name ?? '(item)'
const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—')

// --- intake modal ---
const open = ref(false)
const saving = ref(false)
const active = ref<Row | null>(null)
const form = reactive({
  received_at: '',
  courier_from: '',
  condition: 'good',
  condition_note: '',
  photo_url: '',
})

function openIntake(r: Row) {
  active.value = r
  const i = r.drop_in_intakes
  Object.assign(form, {
    received_at: i?.received_at ? i.received_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    courier_from: i?.courier_from ?? '',
    condition: i?.condition ?? 'good',
    condition_note: i?.condition_note ?? '',
    photo_url: i?.photo_url ?? '',
  })
  open.value = true
}

async function submit() {
  if (!active.value) return
  saving.value = true
  try {
    await save(active.value.id, {
      received_at: form.received_at || new Date().toISOString(),
      received_by: user.value?.id ?? null,
      courier_from: form.courier_from.trim() || null,
      condition: form.condition,
      condition_note: form.condition_note.trim() || null,
      photo_url: form.photo_url || null,
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <span class="text-sm text-stone-500">Leg</span>
      <USelect v-model="filterLeg" :items="legOptions" class="w-72" />
    </div>

    <div class="hidden md:block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 dark:bg-stone-800/40 text-left text-stone-500 border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Order</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Customer</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Item</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-right">Qty</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Diterima</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Kondisi</th>
            <th class="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="r in (items as Row[]) ?? []" :key="r.id" class="hover:bg-stone-50 dark:hover:bg-stone-900/50">
            <td class="px-3 py-2 font-mono text-xs">{{ r.orders?.code }}</td>
            <td class="px-3 py-2">{{ r.orders?.customers?.name ?? '—' }}</td>
            <td class="px-3 py-2 font-medium">{{ itemLabel(r) }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ r.qty }}</td>
            <td class="px-3 py-2">
              <UBadge :color="itemStatusColor(r.status)" variant="soft" class="capitalize">
                {{ r.status.replace('_', ' ') }}
              </UBadge>
            </td>
            <td class="px-3 py-2 text-stone-500">{{ fmtDate(r.drop_in_intakes?.received_at) }}</td>
            <td class="px-3 py-2">
              <UBadge v-if="r.drop_in_intakes" :color="conditionColor(r.drop_in_intakes.condition)" variant="soft" class="capitalize">
                {{ r.drop_in_intakes.condition }}
              </UBadge>
              <span v-else class="text-stone-400">—</span>
            </td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-package-check" @click="openIntake(r)">Terima</UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="8" class="px-3 py-6 text-center text-stone-400">Tidak ada item drop-in.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="r in (items as Row[]) ?? []"
        :key="r.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ itemLabel(r) }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ r.orders?.code }}</span>
          </div>
          <UBadge :color="itemStatusColor(r.status)" variant="soft" class="capitalize shrink-0">
            {{ r.status.replace('_', ' ') }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ r.orders?.customers?.name ?? '—' }}</span>
          <span class="font-medium tabular-nums shrink-0">{{ r.qty }}</span>
        </div>
      </div>
      <p v-if="!(items?.length)" class="text-center text-stone-400 text-sm py-6">Tidak ada item drop-in.</p>
    </div>

    <UModal v-model:open="open" :title="active ? `Terima — ${itemLabel(active)}` : 'Terima'">
      <template #body>
        <div v-if="active" class="space-y-4">
          <p class="text-xs text-stone-500">
            {{ active.orders?.code }} · {{ active.orders?.customers?.name }} · qty {{ active.qty }}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Tgl diterima">
              <UInput v-model="form.received_at" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Kurir asal">
              <UInput v-model="form.courier_from" class="w-full" placeholder="mis. JNE / GoSend" />
            </UFormField>
            <UFormField label="Kondisi">
              <USelect v-model="form.condition" :items="CONDITION_OPTIONS" class="w-full" />
            </UFormField>
          </div>
          <UFormField v-if="form.condition === 'damaged'" label="Catatan kondisi">
            <UInput v-model="form.condition_note" class="w-full" placeholder="kerusakan…" />
          </UFormField>
          <UFormField label="Foto barang">
            <FileUpload v-model="form.photo_url" folder="moments" accept="image/*" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" @click="submit">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
