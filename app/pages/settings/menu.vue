<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Row = Database['public']['Tables']['menus']['Row']

const { can } = useCan()
const { items, create, update, remove } = useMenuAdmin()
const { items: permissions } = usePermissions()
const toast = useToast()

const GROUP_OPTIONS = [
  { label: '— top level —', value: NONE },
  { label: 'Operations', value: 'Operations' },
  { label: 'Catalog', value: 'Catalog' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Master Data', value: 'Master Data' },
  { label: 'Settings', value: 'Settings' },
]

const permissionOptions = computed(() => [
  { label: '— visible to all —', value: NONE },
  ...(permissions.value ?? []).map((p) => ({ label: p.key, value: p.key })),
])

const open = ref(false)
const saving = ref(false)
const editing = ref<Row | null>(null)
const form = reactive({
  label: '',
  icon: '',
  path: '',
  menu_group: NONE,
  sort_order: 0,
  required_permission: NONE,
  is_active: true,
})

function openCreate() {
  editing.value = null
  Object.assign(form, { label: '', icon: '', path: '', menu_group: NONE, sort_order: 0, required_permission: NONE, is_active: true })
  open.value = true
}
function openEdit(row: Row) {
  editing.value = row
  Object.assign(form, {
    label: row.label,
    icon: row.icon ?? '',
    path: row.path ?? '',
    menu_group: fromNullable(row.menu_group),
    sort_order: row.sort_order,
    required_permission: fromNullable(row.required_permission),
    is_active: row.is_active,
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = {
      label: form.label.trim(),
      icon: form.icon.trim() || null,
      path: form.path.trim() || null,
      menu_group: toNullable(form.menu_group),
      sort_order: Number(form.sort_order) || 0,
      required_permission: toNullable(form.required_permission),
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
  if (!(await useConfirm().confirm({ title: 'Hapus menu', description: `Hapus "${row.label}"?` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Menu" subtitle="Atur sidebar tanpa SQL. Perubahan tampil setelah reload." icon="i-lucide-menu">
      <template #actions>
        <UButton v-if="can('menu.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="hidden md:block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-200/70 dark:bg-gray-800/50 text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th class="px-3 py-2.5 w-10"></th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Label</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Group</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Path</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Permission</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Sort</th>
            <th class="px-3 py-2.5 font-medium text-xs uppercase tracking-wide">Active</th>
            <th class="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2"><UIcon :name="row.icon ?? 'i-lucide-dot'" class="size-4 text-gray-400" /></td>
            <td class="px-3 py-2 font-medium">{{ row.label }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.menu_group ?? '—' }}</td>
            <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ row.path }}</td>
            <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ row.required_permission ?? '—' }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.sort_order }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">
                {{ row.is_active ? 'Yes' : 'No' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton v-if="can('menu.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('menu.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-2">
      <div
        v-for="row in items ?? []"
        :key="row.id"
        class="w-full text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon :name="row.icon ?? 'i-lucide-dot'" class="size-4 text-stone-400 shrink-0" />
            <span class="font-medium truncate">{{ row.label }}</span>
            <span class="font-mono text-xs text-stone-400 shrink-0">{{ row.path }}</span>
          </div>
          <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft" class="shrink-0">
            {{ row.is_active ? 'Yes' : 'No' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2">
          <span class="text-xs text-stone-500 truncate">{{ row.menu_group ?? '—' }}</span>
        </div>
      </div>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Edit Menu' : 'Tambah Menu'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Label" required>
              <UInput v-model="form.label" class="w-full" />
            </UFormField>
            <UFormField label="Icon" help="contoh: i-lucide-plane">
              <UInput v-model="form.icon" class="w-full" />
            </UFormField>
            <UFormField label="Path">
              <UInput v-model="form.path" class="w-full" placeholder="/operations/..." />
            </UFormField>
            <UFormField label="Sort order">
              <UInput v-model.number="form.sort_order" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Group">
              <USelect v-model="form.menu_group" :items="GROUP_OPTIONS" class="w-full" />
            </UFormField>
            <UFormField label="Required permission">
              <USelect v-model="form.required_permission" :items="permissionOptions" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="open = false">Batal</UButton>
          <UButton :loading="saving" :disabled="!form.label.trim()" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
