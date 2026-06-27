// Permission check for gating UI actions (create/edit/delete buttons). Page-level
// access is enforced by middleware/permission.global.ts; this is the finer layer
// inside a page (e.g. a read-only user sees the list but no "Tambah" button).
export function useCan() {
  const auth = useAuthStore()
  const can = (key: string) => auth.has(key)
  return { can }
}
