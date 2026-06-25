<script setup lang="ts">
import type { UserRow } from '~/composables/useUsers'

const { items, create, update, remove } = useUsers()
const { items: roles } = useRoles()
const { items: userTypes } = useUserTypes()
const toast = useToast()

const roleOptions = computed(() =>
  (roles.value ?? []).map((r) => ({ label: r.name, value: r.name })),
)
const typeOptions = computed(() => [
  { label: '— none —', value: '' },
  ...(userTypes.value ?? []).map((t) => ({ label: t.name, value: t.name })),
])

const open = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ email: '', password: '', full_name: '', role: 'staff', user_type: '' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { email: '', password: '', full_name: '', role: 'staff', user_type: '' })
  open.value = true
}
function openEdit(row: UserRow) {
  editingId.value = row.id
  Object.assign(form, {
    email: row.email ?? '',
    password: '',
    full_name: row.full_name ?? '',
    role: row.role ?? 'staff',
    user_type: row.user_type ?? '',
  })
  open.value = true
}
async function save() {
  saving.value = true
  try {
    if (editingId.value) {
      await update(editingId.value, {
        full_name: form.full_name.trim() || undefined,
        role: form.role,
        user_type: form.user_type || undefined,
      })
    } else {
      await create({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
        role: form.role,
        user_type: form.user_type || undefined,
      })
    }
    open.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: errorMessage(e), color: 'error' })
  } finally {
    saving.value = false
  }
}
async function onDelete(row: UserRow) {
  if (!confirm(`Hapus user "${row.email}"?`)) return
  try {
    await remove(row.id)
  } catch (e) {
    toast.add({ title: 'Gagal menghapus', description: errorMessage(e), color: 'error' })
  }
}

// $fetch errors carry the server statusMessage on `data`.
function errorMessage(e: unknown): string {
  const err = e as { data?: { statusMessage?: string; message?: string }; message?: string }
  return err?.data?.statusMessage ?? err?.data?.message ?? err?.message ?? 'Terjadi kesalahan'
}

const canSave = computed(() =>
  editingId.value ? true : form.email.trim().length > 0 && form.password.length >= 6,
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Users</h1>
        <p class="text-sm text-gray-500">Akun tim internal + role-nya.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah</UButton>
    </div>

    <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-900 text-left text-gray-500">
          <tr>
            <th class="px-3 py-2 font-medium">Email</th>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">Role</th>
            <th class="px-3 py-2 font-medium">Type</th>
            <th class="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="row in items ?? []" :key="row.id">
            <td class="px-3 py-2">{{ row.email }}</td>
            <td class="px-3 py-2 text-gray-500">{{ row.full_name }}</td>
            <td class="px-3 py-2">
              <UBadge :color="row.role === 'admin' ? 'primary' : 'neutral'" variant="soft">{{ row.role }}</UBadge>
            </td>
            <td class="px-3 py-2 text-gray-500">{{ row.user_type ?? '—' }}</td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(row)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editingId ? 'Edit User' : 'Tambah User'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Email" required>
            <UInput v-model="form.email" type="email" class="w-full" :disabled="!!editingId" />
          </UFormField>
          <UFormField v-if="!editingId" label="Password" required help="Minimal 6 karakter.">
            <UInput v-model="form.password" type="password" class="w-full" />
          </UFormField>
          <UFormField label="Full name">
            <UInput v-model="form.full_name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Role">
              <USelect v-model="form.role" :items="roleOptions" class="w-full" />
            </UFormField>
            <UFormField label="User type">
              <USelect v-model="form.user_type" :items="typeOptions" class="w-full" />
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
  </div>
</template>
