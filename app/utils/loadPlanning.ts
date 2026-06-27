// Luggage status vocab + capacity helpers for Load Planning.

export const LUGGAGE_STATUS_OPTIONS = [
  { label: 'Planned', value: 'planned' },
  { label: 'Packed', value: 'packed' },
  { label: 'Loaded', value: 'loaded' },
  { label: 'Unloaded', value: 'unloaded' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export function luggageStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    planned: 'neutral',
    packed: 'info',
    loaded: 'primary',
    unloaded: 'success',
  }
  return map[status] ?? 'neutral'
}

export function formatKg(grams: number | null | undefined): string {
  return `${(Number(grams ?? 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg`
}

// Total weight a luggage carries = packed contents + its own empty (tare) weight.
export function totalWeightG(loaded: number, tare: number | null | undefined): number {
  return loaded + Number(tare ?? 0)
}
