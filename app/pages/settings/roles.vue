<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Role = Database['public']['Tables']['roles']['Row'] & {
  role_permissions: { count: number }[]
}

const { can } = useCan()
const { items, create, update, remove, getPermissionIds, savePermissions } = useRoles()
const { items: permissions } = usePermissions()
const toast = useToast()

// --- create / edit role ---
const open = ref(false)
const saving = ref(false)
const editing = ref<Role | null>(null)
const form = reactive({ name: '', description: '' })

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', description: '' })
  open.value = true
}
function openEdit(row: Role) {
  editing.value = row
  Object.assign(form, { name: row.name, description: row.description ?? '' })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    const payload = { name: form.name.trim(), description: form.description.trim() || null }
    if (editing.value) await update(editing.value.id, payload)
    else await create(payload)
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: Role) {
  if (!(await useConfirm().confirm({ title: 'Hapus role', description: `Hapus "${row.name}"? Assignment permission-nya ikut terhapus.` }))) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: (e as Error).message, color: 'error' })
  }
}

// --- permission assignment ---
const permOpen = ref(false)
const permSaving = ref(false)
const permRole = ref<Role | null>(null)
const selected = ref<string[]>([])

const permGroups = computed(() => {
  const map = new Map<string, { id: string; key: string }[]>()
  for (const p of permissions.value ?? []) {
    const resource = p.key.split('.')[0] ?? 'other'
    if (!map.has(resource)) map.set(resource, [])
    map.get(resource)!.push({ id: p.id, key: p.key })
  }
  return Array.from(map, ([resource, perms]) => ({ resource, perms }))
})

async function openPermissions(row: Role) {
  permRole.value = row
  selected.value = await getPermissionIds(row.id)
  permOpen.value = true
}
function toggle(id: string, value: boolean) {
  if (value) selected.value = [...selected.value, id]
  else selected.value = selected.value.filter((x) => x !== id)
}
async function savePerms() {
  if (!permRole.value) return
  permSaving.value = true
  try {
    await savePermissions(permRole.value.id, selected.value)
    permOpen.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan permission', description: (e as Error).message, color: 'error' })
  } finally {
    permSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Roles" subtitle="Peran + permission yang menyetir sidebar." icon="i-lucide-shield">
      <template #actions>
        <UButton v-if="can('roles.write')" icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
      </template>
    </PageHeader>

    <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900 text-left text-gray-500">
          <tr>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Description</th>
            <th class="px-3 py-2 font-medium">Permissions</th>
            <th class="px-3 py-2 w-40"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in (items as Role[]) ?? []" :key="row.id">
            <td class="px-3 py-2 font-medium">{{ row.name }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.description }}</td>
            <td class="px-3 py-2">
              <UBadge color="neutral" variant="soft">{{ row.role_permissions?.[0]?.count ?? 0 }}</UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton size="xs" color="primary" variant="soft" icon="i-lucide-key" @click="openPermissions(row)">
                  Permissions
                </UButton>
                <UButton v-if="can('roles.write')" size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton v-if="can('roles.delete')" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- create / edit -->
    <UModal v-model:open="open" :title="editing ? 'Edit Role' : 'Tambah Role'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Description">
            <UInput v-model="form.description" class="w-full" />
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

    <!-- permission matrix -->
    <UModal v-model:open="permOpen" :title="`Permissions — ${permRole?.name ?? ''}`">
      <template #body>
        <div class="space-y-4 max-h-[60vh] overflow-y-auto">
          <div v-for="g in permGroups" :key="g.resource">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{{ g.resource }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <UCheckbox
                v-for="p in g.perms"
                :key="p.id"
                :model-value="selected.includes(p.id)"
                :label="p.key.split('.')[1]"
                @update:model-value="(v: boolean) => toggle(p.id, v)"
              />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <span class="text-xs text-gray-400">{{ selected.length }} dipilih</span>
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="permOpen = false">Batal</UButton>
            <UButton :loading="permSaving" @click="savePerms">Simpan</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
