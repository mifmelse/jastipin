export const TRIP_TYPE_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Round', value: 'round' },
  { label: 'Multi', value: 'multi' },
]

export const TRIP_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Planned', value: 'planned' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'success' | 'error'

export function tripStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    draft: 'neutral',
    planned: 'info',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'error',
  }
  return map[status] ?? 'neutral'
}

// Max legs allowed by trip type (multi is unbounded).
export function maxLegsFor(type: string): number {
  return type === 'single' ? 1 : type === 'round' ? 2 : Infinity
}
