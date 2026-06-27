<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const auth = useAuthStore()
const router = useRouter()
const colorMode = useColorMode()
const toast = useToast()

const name = computed(() => auth.profile?.full_name || user.value?.email || 'User')
const initials = computed(() => {
  const n = auth.profile?.full_name?.trim()
  if (n) return n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (user.value?.email ?? '?').slice(0, 2).toUpperCase()
})

async function logout() {
  await supabase.auth.signOut()
  await router.replace('/login')
}
function setTheme(p: 'light' | 'dark' | 'system') {
  colorMode.preference = p
}

const editOpen = ref(false)
const saving = ref(false)
const form = reactive({ full_name: '', password: '' })
watch(editOpen, (v) => {
  if (v) {
    form.full_name = auth.profile?.full_name ?? ''
    form.password = ''
  }
})
async function saveProfile() {
  saving.value = true
  try {
    if (user.value) {
      const { error } = await supabase.from('profiles').update({ full_name: form.full_name.trim() || null }).eq('id', user.value.id)
      if (error) throw error
    }
    if (form.password) {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error
    }
    await auth.load()
    toast.add({ title: 'Profil tersimpan', color: 'success' })
    editOpen.value = false
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: name.value, type: 'label' }],
  [{ label: 'Edit profile', icon: 'i-lucide-user', onSelect: () => (editOpen.value = true) }],
  [{
    label: 'Ganti tema',
    icon: 'i-lucide-palette',
    children: [
      { label: 'Terang', icon: 'i-lucide-sun', onSelect: () => setTheme('light') },
      { label: 'Gelap', icon: 'i-lucide-moon', onSelect: () => setTheme('dark') },
      { label: 'Sistem', icon: 'i-lucide-monitor', onSelect: () => setTheme('system') },
    ],
  }],
  [{ label: 'Logout', icon: 'i-lucide-log-out', color: 'error', onSelect: logout }],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <button
      class="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
      aria-label="Menu profil"
    >
      {{ initials }}
    </button>
  </UDropdownMenu>

  <UModal v-model:open="editOpen" title="Edit profile">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Email">
          <UInput :model-value="user?.email ?? ''" disabled class="w-full" />
        </UFormField>
        <UFormField label="Nama">
          <UInput v-model="form.full_name" class="w-full" />
        </UFormField>
        <UFormField label="Password baru" help="Kosongkan bila tidak diganti">
          <UInput v-model="form.password" type="password" class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="editOpen = false">Batal</UButton>
        <UButton :loading="saving" @click="saveProfile">Simpan</UButton>
      </div>
    </template>
  </UModal>
</template>
