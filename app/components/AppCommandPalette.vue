<script setup lang="ts">
// Global command palette: jump to any page or fire a quick action. Opens on ⌘K.
const { open } = useCommandPalette()
const { topLevel, groups } = useMenu()
const auth = useAuthStore()
const term = ref('')

type Menuish = { label: string; path: string | null; icon: string | null }
function go(to: string) {
  open.value = false
  navigateTo(to)
}
const toItem = (m: Menuish) => ({
  label: m.label,
  icon: m.icon ?? 'i-lucide-circle',
  onSelect: () => go(m.path ?? '/'),
})

// Quick actions are gated by the same permissions as their target action.
const ACTIONS = [
  { label: 'Buat order', icon: 'i-lucide-shopping-cart', perm: 'orders.write', to: '/operations/orders?new=1' },
  { label: 'Buat trip', icon: 'i-lucide-plane', perm: 'trips.write', to: '/operations/trips?new=1' },
  { label: 'Tambah customer', icon: 'i-lucide-user-plus', perm: 'crm.write', to: '/operations/crm?tab=contacts&new=1' },
]

const cmdGroups = computed(() => {
  const groupsOut = [
    {
      id: 'pages',
      label: 'Halaman',
      items: [...topLevel.value.map(toItem), ...groups.value.flatMap((g) => g.items.map(toItem))],
    },
  ]
  const actions = ACTIONS.filter((a) => auth.has(a.perm)).map((a) => ({
    label: a.label,
    icon: a.icon,
    onSelect: () => go(a.to),
  }))
  if (actions.length) groupsOut.push({ id: 'actions', label: 'Aksi cepat', items: actions })
  return groupsOut
})

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
watch(open, (v) => { if (v) term.value = '' })
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-xl' }">
    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :groups="cmdGroups"
        :close="true"
        placeholder="Cari halaman atau aksi…"
        class="h-80"
        @update:open="open = $event"
      />
    </template>
  </UModal>
</template>
