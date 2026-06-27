// Run `fn` once on mount if the given query param is present (e.g. ?new=1 from a
// command-palette quick action), then strip the param so refresh/back doesn't
// re-trigger it. Other query keys are preserved.
export function useAutoOpen(param: string, fn: () => void) {
  const route = useRoute()
  const router = useRouter()
  function maybe() {
    if (route.query[param] == null) return
    fn()
    const query = { ...route.query }
    delete query[param]
    router.replace({ query })
  }
  onMounted(maybe) // first load lands with the param
  watch(() => route.query[param], (v) => { if (v != null) maybe() }) // already on the page
}
