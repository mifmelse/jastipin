// Detect media kind from a URL (+ optional explicit type) for the viewer.
export function mediaKind(url: string, type?: string): 'image' | 'video' | 'pdf' | 'other' {
  if (type === 'video') return 'video'
  if (type === 'image') return 'image'
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)) return 'image'
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url)) return 'video'
  if (/\.pdf(\?|$)/i.test(url)) return 'pdf'
  return 'other'
}
