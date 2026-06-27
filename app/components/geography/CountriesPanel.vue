<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['countries']['Row']

const { can } = useCan()
const { items, create, update, remove } = useCountries()
const { items: continents } = useContinents()
const toast = useToast()

const continentOptions = computed(() =>
  (continents.value ?? []).map((c) => ({ label: c.name, value: c.id })),
)
const continentName = (id: string) =>
  continents.value?.find((c) => c.id === id)?.name ?? '—'

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({ name: '', iso2: '', iso3: '', dial_code: '', continent_id: '' })

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', iso2: '', iso3: '', dial_code: '', continent_id: '' })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    iso2: row.iso2,
    iso3: row.iso3,
    dial_code: row.dial_code ?? '',
    continent_id: row.continent_id,
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      iso2: form.iso2.trim().toUpperCase(),
      iso3: form.iso3.trim().toUpperCase(),
      dial_code: form.dial_code.trim() || null,
      continent_id: form.continent_id,
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
  if (!(await useConfirm().confirm({ title: 'Hapus country', description: `Hapus "${row.name}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

const valid = computed(
  () => form.name.trim() && form.iso2.trim().length === 2 && form.iso3.trim().length === 3 && form.continent_id,
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UButton v-if="can('geography.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900 text-left text-gray-500">
          <tr>
            <th class="px-3 py-2 font-medium w-16">ISO2</th>
            <th class="px-3 py-2 font-medium w-16">ISO3</th>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Continent</th>
            <th class="px-3 py-2 font-medium w-20">Dial</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2 font-mono text-xs">{{ row.iso2 }}</td>
            <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ row.iso3 }}</td>
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-gray-500">{{ continentName(row.continent_id) }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.dial_code ?? '—' }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('geography.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('geography.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
          <tr v-if="!(items?.length)">
            <td colspan="6" class="px-3 py-6 text-center text-gray-400">Belum ada data.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Country' : 'Tambah Country'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="ISO2" required help="2 huruf">
              <UInput v-model="form.iso2" maxlength="2" class="w-full" />
            </UFormField>
            <UFormField label="ISO3" required help="3 huruf">
              <UInput v-model="form.iso3" maxlength="3" class="w-full" />
            </UFormField>
            <UFormField label="Continent" required>
              <USelect v-model="form.continent_id" :items="continentOptions" class="w-full" placeholder="Pilih…" />
            </UFormField>
            <UFormField label="Dial code" help="mis. +62">
              <UInput v-model="form.dial_code" class="w-full" />
            </UFormField>
          </div>
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
