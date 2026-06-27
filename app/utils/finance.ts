// Finance vocab: payment + payable status, payable source labels/colors.

export const PAYMENT_STATUS_OPTIONS = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export function paymentStatusColor(s: string): BadgeColor {
  const map: Record<string, BadgeColor> = { paid: 'success', pending: 'warning', refunded: 'error' }
  return map[s] ?? 'neutral'
}

export const PAYABLE_SOURCE_LABEL: Record<string, string> = {
  sourcing: 'Sourcing',
  shipping: 'Ongkir',
  trip_expense: 'Biaya trip',
  other: 'Lainnya',
}
export function payableSourceColor(t: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    sourcing: 'primary',
    shipping: 'info',
    trip_expense: 'warning',
    other: 'neutral',
  }
  return map[t] ?? 'neutral'
}
