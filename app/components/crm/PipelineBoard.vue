<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Lead = Database['public']['Tables']['crm_pipeline']['Row'] & {
  customers?: { name: string } | null
  trips?: { name: string; code: string | null } | null
  crm_activities?: { count: number }[]
}

const { can } = useCan()
const { items, create, update, remove, refresh } = useCrmPipeline()
const { items: customers } = useCustomers()
const { items: trips } = useTrips()
const toast = useToast()

const customerOptions = computed(() => (customers.value ?? []).map((c) => ({ label: c.name, value: c.id })))
const tripOptions = computed(() => [
  { label: '— tanpa trip —', value: NONE },
  ...(trips.value ?? []).map((t) => ({ label: t.name, value: t.id })),
])

const router = useRouter()
const byStage = (stage: string) => (items.value ?? []).filter((l) => l.stage === stage)
const leadName = (l: Lead) => l.customers?.name ?? l.contact_name ?? '(tanpa nama)'

// Handoff: a lead at stage 'order' that's tied to a real customer can spawn an
// Order with the customer (and trip→leg) prefilled.
function createOrder(lead: Lead) {
  const query: Record<string, string> = { customer: lead.customer_id! }
  if (lead.trip_id) query.trip = lead.trip_id
  router.push({ path: '/operations/orders', query })
}

// --- add lead ---
// A lead is EITHER a fresh contact (name + phone) OR linked to an existing
// customer — never both. The mode toggle keeps it unambiguous.
const open = ref(false)
const saving = ref(false)
const mode = ref<'new' | 'customer'>('new')
const form = reactive({
  contact_name: '', contact_phone: '', source: '', stage: 'reach',
  customer_id: '', trip_id: NONE, value_estimate: '' as number | '',
})
function openCreate() {
  mode.value = 'new'
  Object.assign(form, { contact_name: '', contact_phone: '', source: '', stage: 'reach', customer_id: '', trip_id: NONE, value_estimate: '' })
  open.value = true
}
// Switching mode clears the mode-specific fields so contact/customer never mix.
watch(mode, () => {
  form.contact_name = ''
  form.contact_phone = ''
  form.customer_id = ''
})
async function save() {
  saving.value = true
  try {
    await create({
      contact_name: mode.value === 'new' ? form.contact_name.trim() || null : null,
      contact_phone: mode.value === 'new' ? form.contact_phone.trim() || null : null,
      source: form.source.trim() || null,
      stage: form.stage,
      customer_id: mode.value === 'customer' ? form.customer_id || null : null,
      trip_id: toNullable(form.trip_id),
      value_estimate: form.value_estimate === '' ? null : Number(form.value_estimate),
    })
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function moveStage(lead: Lead, stage: string) {
  try {
    await update(lead.id, { stage })
  } catch (e) {
    toast.add({ title: 'Gagal pindah stage', description: (e as Error).message, color: 'error' })
  }
}
async function onDelete(lead: Lead) {
  if (!(await useConfirm().confirm({ title: 'Hapus lead', description: `Hapus "${leadName(lead)}"?` }))) return
  try {
    await remove(lead.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

// --- activities modal ---
const activeLead = ref<Lead | null>(null)
const canSave = computed(() => (mode.value === 'new' ? !!form.contact_name.trim() : !!form.customer_id))
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UButton v-if="can('crm.write')" icon="i-lucide-plus" @click="openCreate">Tambah lead</UButton>
    </div>

    <div class="flex gap-3 overflow-x-auto pb-2">
      <div v-for="stage in CRM_STAGES" :key="stage" class="w-64 shrink-0">
        <div class="flex items-center justify-between px-1 pb-2">
          <UBadge :color="crmStageColor(stage)" variant="soft" class="capitalize">{{ stage }}</UBadge>
          <span class="text-xs text-stone-400">{{ byStage(stage).length }}</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="lead in (byStage(stage) as Lead[])"
            :key="lead.id"
            data-testid="lead-card"
            class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="font-medium text-sm">{{ leadName(lead) }}</p>
              <UButton v-if="can('crm.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus lead" @click="onDelete(lead)" />
            </div>
            <div class="flex flex-wrap gap-1 text-xs text-stone-500">
              <span v-if="lead.source" class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-megaphone" class="size-3" />{{ lead.source }}
              </span>
              <span v-if="lead.trips" class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-plane" class="size-3" />{{ lead.trips.code ?? lead.trips.name }}
              </span>
              <span v-if="lead.value_estimate != null">Rp {{ Number(lead.value_estimate).toLocaleString('id-ID') }}</span>
            </div>
            <div class="flex items-center gap-1">
              <USelect
                :model-value="lead.stage"
                :items="CRM_STAGE_OPTIONS"
                size="xs"
                class="flex-1"
                @update:model-value="(v: string) => moveStage(lead, v)"
              />
              <UButton
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-message-square"
                aria-label="Activities"
                @click="activeLead = lead"
              >
                {{ lead.crm_activities?.[0]?.count ?? 0 }}
              </UButton>
            </div>
            <UButton
              v-if="lead.stage === 'order' && lead.customer_id"
              size="xs"
              color="primary"
              variant="soft"
              block
              icon="i-lucide-shopping-cart"
              @click="createOrder(lead)"
            >
              Buat order
            </UButton>
          </div>
          <p v-if="!byStage(stage).length" class="text-xs text-stone-300 dark:text-stone-700 text-center py-4">—</p>
        </div>
      </div>
    </div>

    <UModal v-model:open="open" title="Tambah Lead">
      <template #body>
        <div class="space-y-4">
          <div class="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 text-sm">
            <button
              type="button"
              class="px-3 py-1 rounded-md transition-colors"
              :class="mode === 'new' ? 'bg-primary text-white' : 'text-stone-500'"
              @click="mode = 'new'"
            >
              Calon baru
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-md transition-colors"
              :class="mode === 'customer' ? 'bg-primary text-white' : 'text-stone-500'"
              @click="mode = 'customer'"
            >
              Dari customer
            </button>
          </div>

          <div v-if="mode === 'new'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Contact name" required>
              <UInput v-model="form.contact_name" class="w-full" />
            </UFormField>
            <UFormField label="Contact phone">
              <UInput v-model="form.contact_phone" class="w-full" />
            </UFormField>
          </div>
          <UFormField v-else label="Customer" required>
            <USelect v-model="form.customer_id" :items="customerOptions" class="w-full" placeholder="Pilih customer…" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Source">
              <MasterSelect v-model="form.source" table="lead_sources" />
            </UFormField>
            <UFormField label="Stage">
              <USelect v-model="form.stage" :items="CRM_STAGE_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Trip">
              <USelect v-model="form.trip_id" :items="tripOptions" class="w-full" />
            </UFormField>
            <UFormField label="Value estimate">
              <UInput v-model.number="form.value_estimate" type="number" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!canSave" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>

    <CrmLeadActivities
      v-if="activeLead"
      :pipeline-id="activeLead.id"
      :title="leadName(activeLead)"
      @changed="refresh"
      @close="activeLead = null"
    />
  </div>
</template>
