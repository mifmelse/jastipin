// Shipment status vocab + colors.

export const SHIPMENT_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Failed', value: 'failed' },
]

export const SHIPMENT_STATUSES = ['pending', 'in_transit', 'delivered', 'failed'] as const

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export function shipmentStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    pending: 'neutral',
    in_transit: 'info',
    delivered: 'success',
    failed: 'error',
  }
  return map[status] ?? 'neutral'
}

export const shipmentStatusLabel = (s: string) => s.replace('_', ' ')
