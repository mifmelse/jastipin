import type { Database } from '~/types/database.types'

// Page-level access control: block direct navigation to a route whose matching
// menu requires a permission the user lacks. Permissions live client-side (the
// auth plugin loads them on sign-in), so this runs on the client only — the
// Supabase module already guards unauthenticated access on the server.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  // getSession() is awaited + reads storage directly, so it's reliable even on a
  // full page load (where useSupabaseUser() may not be populated yet).
  const supabase = useSupabaseClient<Database>()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return // unauthenticated → handled by the supabase module

  const auth = useAuthStore()
  if (!auth.loaded) await auth.load(session.user.id)

  // menu path → required_permission, cached for the session
  const menus = useState<{ path: string | null; required_permission: string | null }[] | null>('perm-menus', () => null)
  if (!menus.value) {
    const { data } = await supabase.from('menus').select('path, required_permission').eq('is_active', true)
    menus.value = data ?? []
  }

  // most specific matching menu (exact path, or a parent prefix for detail pages)
  const path = to.path
  const match = (menus.value ?? [])
    .filter((m) => m.path && (m.path === '/' ? path === '/' : path === m.path || path.startsWith(m.path + '/')))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0]

  if (match?.required_permission && !auth.has(match.required_permission)) {
    return navigateTo('/')
  }
})
