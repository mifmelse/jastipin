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
    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors',
    isActive(path)
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60',
  ]
</script>

<template>
  <div class="min-h-screen flex bg-stone-50 dark:bg-stone-950">
    <aside
      class="w-60 shrink-0 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col"
    >
      <div
        class="h-14 flex items-center gap-2 px-4 border-b border-stone-200 dark:border-stone-800"
      >
        <span class="inline-flex items-center justify-center size-7 rounded-lg bg-primary text-white font-bold text-sm">J</span>
        <span class="font-semibold tracking-tight">Jastipin</span>
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
        class="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-end px-4 gap-3"
      >
        <span class="text-sm text-stone-500">{{ user?.email }}</span>
        <UButton size="sm" color="neutral" variant="soft" @click="logout">Logout</UButton>
      </header>
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
