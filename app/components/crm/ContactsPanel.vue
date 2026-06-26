<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['customers']['Row']

const { items, create, remove } = useCustomers()
const { items: countries } = useCountries()
const toast = useToast()
const router = useRouter()

const GENDER_OPTIONS = [
  { label: '— none —', value: NONE },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]
const countryOptions = computed(() => [
  { label: '— none —', value: NONE },
  ...(countries.value ?? []).map((c) => ({ label: c.name, value: c.id })),
])

const open = ref(false)
const saving = ref(false)
const form = reactive({ name: '', phone: '', email: '', gender: NONE, country_id: NONE, notes: '' })

function openCreate() {
  Object.assign(form, { name: '', phone: '', email: '', gender: NONE, country_id: NONE, notes: '' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const created = await create({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      gender: toNullable(form.gender),
      country_id: toNullable(form.country_id),
      notes: form.notes.trim() || null,
    })
    open.value = false
    if (created?.id) router.push(`/operations/customers/${created.id}`)
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: Row) {
  if (!(await useConfirm().confirm({ title: 'Hapus customer', description: `Hapus "${row.name}"? Alamatnya ikut terhapus.` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
const addressCount = (row: { customer_addresses?: { count: number }[] }) =>
  row.customer_addresses?.[0]?.count ?? 0
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah customer</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-50 dark:bg-stone-900 text-left text-stone-500">
          <tr>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Phone</th>
            <th class="px-3 py-2 font-medium">Email</th>
            <th class="px-3 py-2 font-medium">Country</th>
            <th class="px-3 py-2 font-medium text-right">Addresses</th>
            <th class="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr
            v-for="row in items ?? []"
            :key="row.id"
            class="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
            @click="router.push(`/operations/customers/${row.id}`)"
          >
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.phone ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.email ?? '—' }}</td>
            <td class="px-3 py-2 text-stone-500">{{ row.countries?.name ?? '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-stone-500">{{ addressCount(row) }}</td>
            <td class="px-3 py-2" @click.stop>
              <div class="flex justify-end">
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-stone-400">Belum ada customer.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" title="Tambah Customer">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Phone">
              <UInput v-model="form.phone" class="w-full" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="form.email" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Gender">
              <USelect v-model="form.gender" :items="GENDER_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Country">
              <USelect v-model="form.country_id" :items="countryOptions" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Notes">
            <UTextarea v-model="form.notes" class="w-full" :rows="2" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.name.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
