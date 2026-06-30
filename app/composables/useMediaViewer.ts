export type MediaItem = { url: string; type?: string }

// Global media lightbox state. Call open() from anywhere; a single <MediaViewer>
// mounted in the layout renders it. Replaces "open in new tab".
export function useMediaViewer() {
  const items = useState<MediaItem[]>('mv-items', () => [])
  const index = useState<number>('mv-index', () => 0)
  const isOpen = useState<boolean>('mv-open', () => false)

  function open(media: MediaItem | MediaItem[], startIndex = 0) {
    const list = (Array.isArray(media) ? media : [media]).filter((m) => !!m?.url)
    if (!list.length) return
    items.value = list
    index.value = Math.min(Math.max(0, startIndex), list.length - 1)
    isOpen.value = true
  }
  function close() {
    isOpen.value = false
  }
  function next() {
    if (index.value < items.value.length - 1) index.value++
  }
  function prev() {
    if (index.value > 0) index.value--
  }

  return { items, index, isOpen, open, close, next, prev }
}
