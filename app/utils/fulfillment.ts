// Fulfillment vocab: sourcing record statuses + drop-in condition.

export const SOURCING_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sourcing', value: 'sourcing' },
  { label: 'Purchased', value: 'purchased' },
  { label: 'Out of stock', value: 'out_of_stock' },
]

export const CONDITION_OPTIONS = [
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export function conditionColor(c: string): BadgeColor {
  return c === 'damaged' ? 'error' : 'success'
}
