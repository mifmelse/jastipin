// Shared open-state for the global command palette (⌘K). Used by the topbar
// trigger and the palette component.
export function useCommandPalette() {
  const open = useState('cmdk-open', () => false)
  return { open }
}
