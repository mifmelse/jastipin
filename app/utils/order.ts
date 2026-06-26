// Order + item status vocab, fulfillment types, badge colors, and the
// leg-label helper shared by the Order list/detail.

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export const ORDER_STATUSES = [
  'draft', 'confirmed', 'paid', 'fulfilling', 'packed',
  'in_transit', 'delivered', 'completed', 'cancelled', 'refunded',
] as const

export const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((s) => ({
  label: s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
  value: s,
}))

export function orderStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    draft: 'neutral',
    confirmed: 'info',
    paid: 'primary',
    fulfilling: 'warning',
    packed: 'warning',
    in_transit: 'info',
    delivered: 'success',
    completed: 'success',
    cancelled: 'error',
    refunded: 'error',
  }
  return map[status] ?? 'neutral'
}

export const ITEM_STATUSES = [
  'pending', 'sourcing', 'purchased', 'received', 'out_of_stock',
  'in_warehouse', 'packed', 'delivered', 'cancelled',
] as const

export const ITEM_STATUS_OPTIONS = ITEM_STATUSES.map((s) => ({
  label: s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
  value: s,
}))

export function itemStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    pending: 'neutral',
    sourcing: 'warning',
    purchased: 'info',
    received: 'info',
    out_of_stock: 'error',
    in_warehouse: 'primary',
    packed: 'primary',
    delivered: 'success',
    cancelled: 'error',
  }
  return map[status] ?? 'neutral'
}

export const FULFILLMENT_OPTIONS = [
  { label: 'Sourcing (shopper belanja)', value: 'sourcing' },
  { label: 'Drop-in (customer kirim)', value: 'drop_in' },
]

// Structural shape of an embedded trip_route (leg) used across the Order UI.
export type LegEmbed = {
  sequence?: number | null
  departure_date?: string | null
  trips?: { name: string; code: string | null } | null
  from_country?: { iso2: string | null; name: string } | null
  to_country?: { iso2: string | null; name: string } | null
} | null

// "TRP-001 · ID→JP · 2026-07-01"
export function legLabel(leg: LegEmbed): string {
  if (!leg) return '—'
  const trip = leg.trips?.code ?? leg.trips?.name ?? 'Trip'
  const from = leg.from_country?.iso2 ?? leg.from_country?.name ?? '?'
  const to = leg.to_country?.iso2 ?? leg.to_country?.name ?? '?'
  const date = leg.departure_date ? ` · ${leg.departure_date}` : ''
  return `${trip} · ${from}→${to}${date}`
}

export function formatIDR(n: number | null | undefined): string {
  return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`
}
