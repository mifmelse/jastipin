// Keep the auth store in sync with the Supabase session: load profile +
// permissions on sign-in, clear them on sign-out.
export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const auth = useAuthStore()

  watch(
    user,
    (u) => {
      if (u) auth.load()
      else auth.reset()
    },
    { immediate: true },
  )
})
