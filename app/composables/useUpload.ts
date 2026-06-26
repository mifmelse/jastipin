// Upload a file to the public 'media' Storage bucket, returns its public URL.
export function useUpload(bucket = 'media') {
  const supabase = useSupabaseClient()

  async function upload(file: File, folder = ''): Promise<string> {
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot) : ''
    const path = `${folder ? folder + '/' : ''}${crypto.randomUUID()}${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600' })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  // Delete by public URL (extracts the object path after the bucket segment).
  async function remove(url: string) {
    const marker = `/object/public/${bucket}/`
    const i = url.indexOf(marker)
    if (i < 0) return
    const path = url.slice(i + marker.length)
    await supabase.storage.from(bucket).remove([path])
  }

  return { upload, remove }
}
