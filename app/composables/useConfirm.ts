// Reusable confirmation dialog (replaces the native confirm()).
// Backed by a single <ConfirmDialog> mounted in app.vue. Usage:
//   if (!(await useConfirm().confirm({ description: 'Hapus X?' }))) return

type ConfirmColor = 'error' | 'primary' | 'neutral'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: ConfirmColor
}

interface ConfirmState {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  color: ConfirmColor
}

const state = reactive<ConfirmState>({
  open: false,
  title: 'Konfirmasi',
  description: '',
  confirmLabel: 'Hapus',
  cancelLabel: 'Batal',
  color: 'error',
})

let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions = {}): Promise<boolean> {
    state.title = options.title ?? 'Konfirmasi'
    state.description = options.description ?? 'Lanjutkan tindakan ini?'
    state.confirmLabel = options.confirmLabel ?? 'Hapus'
    state.cancelLabel = options.cancelLabel ?? 'Batal'
    state.color = options.color ?? 'error'
    state.open = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function resolve(value: boolean) {
    if (resolver) {
      resolver(value)
      resolver = null
    }
    state.open = false
  }

  return { state, confirm, resolve }
}
