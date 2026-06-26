<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const { topLevel, groups } = useMenu()

const sidebarOpen = ref(false)
// Close the mobile drawer on navigation.
watch(() => route.fullPath, () => (sidebarOpen.value = false))

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
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950">
    <!-- mobile backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-60 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col transition-transform md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="h-14 flex items-center gap-2 px-4 border-b border-stone-200 dark:border-stone-800">
        <span class="inline-flex items-center justify-center size-7 rounded-lg bg-primary text-white font-bold text-sm">J</span>
        <span class="font-semibold tracking-tight">Jastipin</span>
      </div>

      <ClientOnly>
        <nav class="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
          <div class="space-y-1">
            <NuxtLink v-for="m in topLevel" :key="m.id" :to="m.path ?? '#'" :class="linkClass(m.path)">
              <UIcon :name="m.icon ?? 'i-lucide-dot'" class="size-4" />
              {{ m.label }}
            </NuxtLink>
          </div>

          <div v-for="g in groups" :key="g.name" class="space-y-1">
            <p class="px-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{{ g.name }}</p>
            <NuxtLink v-for="m in g.items" :key="m.id" :to="m.path ?? '#'" :class="linkClass(m.path)">
              <UIcon :name="m.icon ?? 'i-lucide-dot'" class="size-4" />
              {{ m.label }}
            </NuxtLink>
          </div>
        </nav>
      </ClientOnly>
    </aside>

    <div class="md:pl-60 flex flex-col min-h-screen">
      <header
        class="sticky top-0 z-20 h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-3 px-4"
      >
        <UButton
          class="md:hidden"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          aria-label="Buka menu"
          @click="sidebarOpen = true"
        />
        <div class="flex-1" />
        <span class="text-sm text-stone-500 truncate max-w-[40vw]">{{ user?.email }}</span>
        <UButton size="sm" color="neutral" variant="soft" @click="logout">Logout</UButton>
      </header>
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
