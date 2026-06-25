<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const { topLevel, groups } = useMenu()

async function logout() {
  await supabase.auth.signOut()
  await router.replace('/login')
}

function isActive(path: string | null) {
  if (!path) return false
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

const linkClass = (path: string | null) =>
  [
    'flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800',
    isActive(path)
      ? 'bg-gray-100 dark:bg-gray-800 font-medium text-primary'
      : 'text-gray-700 dark:text-gray-300',
  ]
</script>

<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950">
    <aside
      class="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col"
    >
      <div
        class="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 font-semibold"
      >
        Jastipin
      </div>

      <ClientOnly>
        <nav class="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
          <div class="space-y-1">
            <NuxtLink
              v-for="m in topLevel"
              :key="m.id"
              :to="m.path ?? '#'"
              :class="linkClass(m.path)"
            >
              <UIcon :name="m.icon ?? 'i-lucide-dot'" class="size-4" />
              {{ m.label }}
            </NuxtLink>
          </div>

          <div v-for="g in groups" :key="g.name" class="space-y-1">
            <p class="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {{ g.name }}
            </p>
            <NuxtLink
              v-for="m in g.items"
              :key="m.id"
              :to="m.path ?? '#'"
              :class="linkClass(m.path)"
            >
              <UIcon :name="m.icon ?? 'i-lucide-dot'" class="size-4" />
              {{ m.label }}
            </NuxtLink>
          </div>
        </nav>
      </ClientOnly>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-end px-4 gap-3"
      >
        <span class="text-sm text-gray-500">{{ user?.email }}</span>
        <UButton size="sm" color="neutral" variant="soft" @click="logout">Logout</UButton>
      </header>
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
