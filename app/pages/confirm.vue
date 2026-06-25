<script setup lang="ts">
// Auth callback target (magic link / OAuth). For email+password login this is
// rarely hit, but the Supabase module needs the route to exist.
definePageMeta({ layout: false })

const user = useSupabaseUser()
const router = useRouter()

watchEffect(() => {
  router.replace(user.value ? '/' : '/login')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center text-sm text-gray-500">
    Mengarahkan…
  </div>
</template>
