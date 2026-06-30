// Case-insensitive name lookup for resolving Excel-import FKs by name.
export function matchByName<T extends { name: string }>(arr: T[] | null | undefined, n: unknown): T | undefined {
  const s = String(n ?? '').trim().toLowerCase()
  if (!s) return undefined
  return (arr ?? []).find((x) => x.name.toLowerCase() === s)
}

// Coerce a spreadsheet cell to a number-or-empty (for numOrNull-style helpers).
export function numCell(v: unknown): number | '' {
  return v === null || v === undefined || v === '' ? '' : Number(v)
}

// Truthy unless explicitly "false"/0 in the sheet (defaults to active).
export function activeCell(v: unknown): boolean {
  return !(v === false || String(v).toLowerCase() === 'false' || String(v) === '0')
}
