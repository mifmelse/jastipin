// Warehouse condition vocab (good / damaged / missing).

export const WH_CONDITION_OPTIONS = [
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Missing', value: 'missing' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'

export function warehouseConditionColor(c: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    good: 'success',
    damaged: 'warning',
    missing: 'error',
  }
  return map[c] ?? 'neutral'
}

// Effective packing weight: actual weigh wins over the item/product estimate.
export function effectiveWeightG(
  weighed: number | null | undefined,
  estimate: number | null | undefined,
): number | null {
  return weighed ?? estimate ?? null
}
